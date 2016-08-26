(function () {
    "use strict";
    var currentServerId;
    var downloads = {};
    var promises = {};
    var downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();
    var list;
    var currList;
    var updating = false;
    var prefix;

    var push = function () {
        this._initializeKeys();
        var length = arguments.length;
        for (var i = 0; i < length; i++) {
            var item = arguments[i];
            if (this._binding) {
                item = WinJS.Binding.as(item);
            }
            var key = item.id.toString();
            this._keys.push(key);
            if (this._data) {
                this._modifyingData++;
                try {
                    this._data.push(arguments[i])
                } finally {
                    this._modifyingData--;
                }
            }
            this._keyMap[key] = { handle: key, key: key, data: item };
            this._notifyItemInserted(key, this._keys.length - 1, item);
        }
        return this.length;
    }

    function _processDownload(id, download, action) {
        id = id.toString();
        var me = this;
        return download[action]().then(function () {
            downloads[id].completed = true;
            downloads[id].progress = 1;
            list.dataSource.change(id, downloads[id]);
            return MED.LocalStorage.setItem('downloads-list', JSON.stringify(downloads)).then(function () {
                delete promises[prefix + '-' + id];
            });
            
        }, function () {
            console.log('e');
            delete promises[prefix + '-' + id];
        }, function (p) {
            if (!downloads[id]) {
                return;
            }
            downloads[id].progress = p.progress.bytesReceived / p.progress.totalBytesToReceive;
            list.dataSource.change(id, downloads[id]);
        });

    };

    function init() {
        var me = this;
        currentServerId = MED.Settings.get('currentServerId');
        prefix = MED.LocalStorage.getPrefix();

        list = new WinJS.Binding.List();
        MED.Downloads.list = list;
        list.push = push;
        currList = list;
        MED.LocalStorage.getItem('downloads-list').done(function (data) {
            downloads = JSON.parse(data) || {};
            list.dataSource.beginEdits();

            for (var id in downloads) {
                if (!downloads[id].completed) {
                    downloads[id].progress = 0;
                    list.push(downloads[id]);
                }
            }
            list.dataSource.endEdits();


            Windows.Networking.BackgroundTransfer.BackgroundDownloader.getCurrentDownloadsAsync().done(function (downloadsList) {
                downloadsList.forEach(function (download) {
                    var id = download.resultFile.displayName.substr(prefix.length);
                    if (downloads[id]) {
                        _processDownload(id, download, 'attachAsync');
                    } else {
                        //download.
                        var r = 0;
                    }
                });
            });
            window.downloads = downloads;

        });
       
    }

    function isDownloaded(id) {
        return (!!downloads[id] && downloads[id].completed);
    }

    function isBeingDownloaded(id) {
        return (!!downloads[id] && !downloads[id].completed);
    }

    function _addItem(id, preview) {
        var me = this;
        if (isDownloaded(id) || isBeingDownloaded(id)) {
            console.debug('Ignoring download' + id);
            return;
        }

        MED.Server.getMediaDetails(id).then(function (data) {
            data.completed = false;

            data.progress = 0;

            downloads[id] = data;
            MED.LocalStorage.setItem('downloads-list', JSON.stringify(downloads)).then(function (d) {
                console.log(d);
            });
            list.push(data);

            var uri = new Windows.Foundation.Uri(MED.Settings.get('currentServer') + '/content/' + id + '.' + data.subtype);
            Windows.Storage.ApplicationData.current.localFolder.createFileAsync(prefix + '-preview-' + id + '.png', Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
                var binary = atob(preview.split(',')[1]);
                var array = [];
                for (var i = 0; i < binary.length; i++) {
                    array.push(binary.charCodeAt(i));
                }
                Windows.Storage.FileIO.writeBytesAsync(file, new Uint8Array(array));
            });

            Windows.Storage.ApplicationData.current.localFolder.createFileAsync(prefix + id + '.' + data.subtype, Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
                var download = downloader.createDownload(uri, file);
                return _processDownload(id, download, 'startAsync');
            })
        });
    }

    function _addItemsR(folder) {
        folder._value.items.forEach(function (item) {
            if (item.type === 'media') {
                _addItem(item.id, item.preview);
            } else {
                _addItemsR(MED.Server.getFolderById(item.id));
            }
        });
    }
    function _addFolder(id) {
        var folder = MED.Server.getFolderById(id);
        _addItemsR(folder);
    }

    function add(item) {
        switch (item.type) {
            case 'folder':
                _addFolder(item.id);
                break;
            case 'media':
                _addItem(item.id, item.preview);
                break;
            default:
                throw new Error('Unsupported type');
        }
    }

    function remove(id) {
        if (!downloads[id]) {
            console.log('not found, ignoring');
            return;
        }
        if (promises[prefix + '-' + id]) {
            console.log('downloading, cancelling');
            promises[prefix + '-' + id].cancel();
            delete promises[prefix + '-' + id];
        }
        var extension = downloads[id].subtype;

        delete downloads[id];
        MED.LocalStorage.setItem('downloads-list', JSON.stringify(downloads));
        list.splice(list.indexOfKey(id.toString()), 1);
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync(prefix + '-preview-' + id + '.png').then(function (file) {
            file.deleteAsync();
        });
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync(prefix + '-' + id + '.' + extension).then(function (file) {
            file.deleteAsync();
        });
    }

    function getDetails(id) {
        return downloads[id];
    }

    function loadComments(id) {
        var server = localStorage.getItem('currentServer');
        return MED.SecureSettings.get('token').then(function (token) {
            return WinJS.xhr({
                url: server + '/api/mobile/comments/' + id + "?dc=" + Math.random(),
                headers: {
                    'Authorization': 'bearer ' + token
                },
                responseType: 'json'
            });
        });
    }
    var getFilterData = function (filter) {
        var resultList = [];

        switch (filter) {
            case 'downloaded':
                resultList = getList(true);
                break;
            case 'inprogress':
                resultList = getList(false);
                break;
            default:
                resultList = getAllList();
        }
        return resultList;
    }
    var getAllList = function () {
        var result = [];

        for (var i in downloads) {
            result.push(downloads[i]);
        }
        list.splice(0, list.length);
        result.forEach(function (item) {
            list.push(item);
        });
        return list;
    }
    var getList = function (isDownloaded) {
        var result = [];

        for (var i in downloads) {
            if (downloads[i].completed === isDownloaded) {
                result.push(downloads[i]);
            }
        }

        list.splice(0, list.length);
        result.forEach(function (item) {
            list.push(item);
        });
        return list;
    }
    function sendComment(id, comment) {
        var server = localStorage.getItem('currentServer');
        return MED.SecureSettings.get('token').then(function (token) {
            return WinJS.xhr({
                url: server + '/api/mobile/comments',
                type: 'POST',
                data: JSON.stringify({ id: id, text: comment, author: localStorage.getItem('name') }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'bearer ' + token

                }
            }).then(function (responce) {
                return responce;
            }, function (err) {
                console.log(err);
            });
        });
    }
    WinJS.Namespace.define("MED.Downloads", {
        add: add,
        remove: remove,
        init: init,
        getFilterData: getFilterData,
        list: list,
        isDownloaded: isDownloaded,
        sendComment: sendComment,
        loadComments: loadComments,
        getDetails: getDetails,
        isBeingDownloaded: isBeingDownloaded
    });
})();