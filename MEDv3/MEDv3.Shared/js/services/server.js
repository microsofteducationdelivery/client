(function () {
    "use strict";

    var cachedData = null;
    var favorites = [];

    function login(credentials) {
        return WinJS.xhr({
            type: 'POST',
            url: credentials.server + '/api/auth/login',
            responseType: 'json',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: "login=" + credentials.login + "&password=" + credentials.password
        }).then(function ok(req) {
            var response = JSON.parse(req.responseText);
            MED.Settings.set('loggedIn', true);
            MED.Settings.set('name', response.user.name);
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
    function getFavorites(id) {
        return favorites.indexOf(id) !== -1;
    }
    function getFavoriteData() {
        var res = {},
            parentId,
            root = cachedData.data[0],
            el;
        res.items = [];
        root.items.forEach(function (item) {
            if (favorites.indexOf(item.id) !== -1) {
                res.items.push(item);
            }
        });
        
        return WinJS.Promise.as(res);
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
        if (id.toString().search('library') === -1 || !cachedData) {
            return false;
        }
        return MED.LocalStorage.getItem('favorites').then(function (data) {
            favorites = !!data ? JSON.parse(data) : [];
            var index = favorites.indexOf(id);

            if (favorite && index !== 1) {
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
        return cachedData ? WinJS.Promise.as(cachedData) : MED.LocalStorage.getItem('data').then(function (data) {
            cachedData = JSON.parse(data);
            return WinJS.Promise.as(cachedData);
        })
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
        getFolderById: getFolderById,
        getPath: getPath,
        getFiltredata: getFiltredata,
        loadData: loadData,
        getCachedData: getCachedData,
        getMediaDetails: getMediaDetails
    });
})();