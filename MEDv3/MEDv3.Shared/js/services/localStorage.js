(function () {
    'use strict';
    var get = function (name) {
        return Windows.Storage.ApplicationData.current.localFolder.getFileAsync(this._keyString + name + '.json').then(function (file) {
            return Windows.Storage.FileIO.readTextAsync(file).then(function(text) {
                return text;
            });
        }).then(function(a) { return a; }, function(err){
            return null;
        });
    }

    var set = function (name, value) {
        return Windows.Storage.ApplicationData.current.localFolder.createFileAsync(this._keyString + name + '.json', Windows.Storage.CreationCollisionOption.replaceExisting).then(function (file) {
            return Windows.Storage.FileIO.writeTextAsync(file, value);
        });
    };
    var init = function () {
        var userName = MED.Settings.get('name').replace(' ', '-');
        var server = MED.Settings.get('currentServerId');
        this._keyString = server + '-' + userName + '-';
    };
    var getPrefix = function () {
        return this._keyString;
    };
    var remove = function (name) {
        return Windows.Storage.ApplicationData.current.localFolder.getFileAsync(this._keyString + name + '.json').then(function (file) {
            return file.deleteAsync();
        }).then(function (a) { return a; }, function (err) {
            return null;
        });
    };

    WinJS.Namespace.define("MED.LocalStorage", {
        getItem: get,
        setItem: set,
        getPrefix: getPrefix,
        init: init,
        removeItem: remove
    });
})();