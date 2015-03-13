(function () {
    "use strict";
    WinJS.UI.Pages.define("/pages/library.html", {
        init: function () {
            this._tapHandler = this.tapHandler.bind(this);
        },

        tapHandler: function (event) {
            event.detail.itemPromise.then(function (item) {
                if (item.data.type === 'folder') {
                    WinJS.Navigation.navigate('/pages/library.html', { id: item.data.id });
                } else {
                    if (MED.Downloads.isDownloaded(item.data.id)) {
                        WinJS.Navigation.navigate('/pages/media.html', item.data);
                        return;
                    }

                    if (MED.Downloads.isBeingDownloaded(item.data.id)) {
                        var msgBox = new Windows.UI.Popups.MessageDialog('Error: already queued for download');
                        msgBox.showAsync();
                        return;
                    }
                    

                    var msgBox = new Windows.UI.Popups.MessageDialog('Queued for download');
                    MED.Downloads.add(item.data);
                    msgBox.showAsync();


                }
            });
        },

        ready: function (element, options) {
            var that = this;
            var data = WinJS.Binding.as({ title: '' });
            WinJS.Binding.processAll(element, data);
            var list = this._list = element.querySelector('.b-library__list').winControl;
            WinJS.UI.processAll(element).then(function () {
                document.getElementById('appbar').winControl.showOnlyCommands(['btn-help', 'btn-settings']);


                var libraryTemplate = document.getElementById('libraryListItemTemplate').winControl;
                var mediaTemplate = document.getElementById('mediaListItemTemplate').winControl;

                var renderer = function (itemPromise) {
                    return itemPromise.then(function (item) {
                        switch (item.data.type) {
                            case 'folder': 
                                return libraryTemplate.renderItem(itemPromise);
                            case 'media':
                                return mediaTemplate.renderItem(itemPromise);
                            default:
                                throw new Error('Unknown type');
                        }
                    });
                }

                list.addEventListener('iteminvoked', that._tapHandler);
                list.itemTemplate = renderer;


                MED.Server.getCachedData().then(function (data) {
                    var info = data.data[options.id];
                    data.title = info.title;
                    WinJS.Binding.processAll(element, data);


                    list.itemDataSource = (new WinJS.Binding.List(info.items)).dataSource;
                });
            })
        },

        unload: function () {
            if (this._list) {
                this._list.removeEventListener('iteminvoked', this._tapHandler);
            }
        }
    });
})();