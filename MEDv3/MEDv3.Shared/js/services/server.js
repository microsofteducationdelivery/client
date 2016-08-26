(function () {
    "use strict";

    var cachedData = null;
    var favorites = [];
    var stat = {}
    var deviceId;
    // get deviceId, or create and store one
    var localSettings = Windows.Storage.ApplicationData.current.localSettings;
    if (localSettings.values.deviceId) {
        deviceId = localSettings.values.deviceId;
    }
    else {
        // App-specific hardware id could be used as uuid, but it changes if the hardware changes...
        try {
            var ASHWID = Windows.System.Profile.HardwareIdentification.getPackageSpecificToken(null).id;
            deviceId = Windows.Storage.Streams.DataReader.fromBuffer(ASHWID).readGuid();
        } catch (e) {
            // Couldn't get the hardware UUID
            deviceId = createUUID();
        }
        //...so cache it per-install
        localSettings.values.deviceId = deviceId;
    }
    function login(credentials) {
        return WinJS.xhr({
            type: 'POST',
            url: credentials.server + '/api/auth/login',
            // responseType: 'json',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: "login=" + credentials.login + "&password=" + credentials.password + "&deviceId=" + localSettings.values.deviceId
        }).then(function ok(req) {
            var response = JSON.parse(req.responseText);
            MED.Settings.set('loggedIn', true);
            MED.Settings.set('name', response.user.id);
            MED.Settings.set('currentServerId', response.serverId);
            MED.SecureSettings.set('token', response.token);
            if (credentials.rememberme) {
                for (var key in credentials) {
                    MED.SecureSettings.set(key, credentials[key]);
                }
            }
            MED.Settings.set('currentServer', credentials.server);
            MED.LocalStorage.init();
            MED.LocalStorage.getItem('favorites').then(function (fav) {
                favorites = JSON.parse(fav) || [];
            });
        });
    }
    function getFolderById(id) {
        var serverId = MED.Settings.get('currentServerId');
        return cachedData ? WinJS.Promise.as(cachedData.data[id.toString()]) : WinJS.Promise.as([]);
    }
    function getFavoriteMedias() {
        return getCachedData().then(function () {
            var favoritesMedia = [];
            var data = cachedData.data;
            var items;

            for (var key in data) {
                items = data[key].items;

                items.forEach(function (item) {
                    if (item.type === 'media' && getFavorites(item.id)) {
                        favoritesMedia.push(item);
                    }
                });
            }

            return { items: favoritesMedia };
        });
    }
    function getFavorites(id) {
        return favorites.indexOf(id.toString()) !== -1;
    }
    function getFavoriteData() {
        if (!cachedData) {
            return WinJS.Promise.as({items: []});
        }
        var res = {},
            parentId,
            root = cachedData.data,
            el;
        return MED.Server.getFavoriteMedias().then(function (medias) {
            res.items = [];
            var mediaArr = medias ? medias.items : [];
            if (!root) {
                return WinJS.Promise.as({
                    items: res.items,
                    motd: cachedData.motd
                });
            }
            for (var key in root) {
                             
                if (favorites.indexOf(key) !== -1) {
                    var parentId = root[key].parentId;
                    root[parentId].items.forEach(function (item) {
                        if (item.id.toString() === key) {
                            res.items.push(item);
                        }
                    });
                    
                }
            }
          /*  root.items.forEach(function (item) {
                if (favorites.indexOf(item.id) !== -1) {
                    res.items.push(item);
                }
            });*/
            mediaArr.forEach(function (item) {
                res.items.push(item);
            });
            return WinJS.Promise.as({
                items: res.items,
                motd: cachedData.motd
            });

        });      
        
    }
    function getFiltredata(filter) {
        switch (filter) {
            case 'all':
                return getFolderById(0);
            case 'favorites':
                return getFavoriteData();
            case 'recent':
                return getFolderById(0);
        }
        
    }
    function setFavorite(id, favorite) {
        if (!cachedData) {
            return false;
        }
        return MED.LocalStorage.getItem('favorites').then(function (data) {
            favorites = !!data ? JSON.parse(data) : [];
            var index = favorites.indexOf(id);

            if (favorite && index === -1) {
                favorites.push(id);
            } else if (index !== -1) {
                favorites.splice(index, 1);
            }
            MED.LocalStorage.setItem('favorites', JSON.stringify(favorites));
        });
    }
    function loadData () {
        var server = MED.Settings.get('currentServer');
        var serverId = MED.Settings.get('currentServerId');
        return MED.SecureSettings.get('token').then(function (token) {
            WinJS.xhr({
                type: 'POST',
                url: server + '/api/mobile/data?dc=' + Math.random(),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'bearer ' + token
                },
                data: JSON.stringify(stat)
            }).then(function () {
                console.log('stat was upload');
                clearStat();
            }, function (err) {
                console.log(err);
            }); 
            return WinJS.xhr({
                url: server + '/api/mobile/data?dc=' + Math.random(),
                headers: {
                    'Authorization': 'bearer ' + token
                }
            }).then(function ok(req) {
                var data = JSON.parse(req.responseText);
                cachedData = data;

                return MED.LocalStorage.setItem('data', req.responseText).then(function () {
                    syncManager.sync();
                    return WinJS.Promise.as(data);
                });
            }, function (err) {
                return WinJS.Promise.as(err);
            });
            MED.Settings.set('name', response.user.name);
        });
    }
    function clearStat() {
        stat = {}
    }
    function addStat(mediaId, count) {
        stat = stat || {};
        var id = mediaId.toString();
        if (stat[id]) {
            stat[id] += count;
        } else {
            stat[id] = count;
        }
        MED.LocalStorage.setItem('stat', JSON.stringify(stat));
    }
    function getPath(id) {
        if (!cachedData) {
            return false;
        }
        var path = [],
            currId = id.toString(),
            data = cachedData.data
        ;

        for (var i in data) {
            data[i].items.forEach(function (item) {
                if (item.type !== 'media' && data[item.id]) {
                    data[item.id].parentId = i;
                }
            });
        }
        var currItem = data[id.toString()];
        while (currItem) {            
            currId = currItem.parentId;
            currItem = currId ? data[currId] : null;
            if (currItem) {
                path.push({ title: currItem.title, id: currId });
            }
        }
        return path.reverse();
    }
    function getCachedData () {
        var serverId = MED.Settings.get('currentServerId');
        MED.LocalStorage.getItem('stat').then(function (item) {
            stat = JSON.parse(item) || {};
        });  
        return MED.LocalStorage.getItem('favorites').then(function (data) {
            favorites = !!data ? JSON.parse(data) : [];
            return cachedData ? WinJS.Promise.as(cachedData) : MED.LocalStorage.getItem('data').then(function (data) {
                cachedData = JSON.parse(data);
                if (!cachedData) {
                    cachedData = {
                        data: [],
                        motd: ''
                    }
                }
                return WinJS.Promise.as(cachedData);
            });
        });
    }

    function getMediaDetails(id) {
        var server = MED.Settings.get('currentServer');
        return MED.SecureSettings.get('token').then(function (token) {
            return WinJS.xhr({
                url: server + '/api/mobile/media/' + id,
                headers: {
                    'Authorization': 'bearer ' + token
                }
            }).then(function ok(req) {
                var data = JSON.parse(req.responseText);
                return WinJS.Promise.as(data);
            });
        });
    }

    function clearCachedData() {
        cachedData = null;
    }
    var syncManager = WinJS.Class.define(function () {

        }, {
        sync: function () {
            this.dispatchEvent('synced', true);
        }
    });
    WinJS.Class.mix(syncManager, WinJS.Utilities.eventMixin);
    WinJS.Class.mix(
       syncManager,
       WinJS.Utilities.createEventProperties('synced')
    );
    syncManager = new syncManager()
    WinJS.Namespace.define("MED.Server", {
        clearCachedData: clearCachedData,
        login: login,
        syncManager: syncManager,
        setFavorite: setFavorite,
        getFavorite: getFavorites,
        addStat: addStat,
        getFavoriteData: getFavoriteData,
        getFavoriteMedias: getFavoriteMedias, 
        getFolderById: getFolderById,
        getPath: getPath,
        getFiltredata: getFiltredata,
        loadData: loadData,
        getCachedData: getCachedData,
        getMediaDetails: getMediaDetails
    });
})();