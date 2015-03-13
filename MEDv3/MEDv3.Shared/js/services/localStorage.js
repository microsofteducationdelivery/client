(function () {
    'use strict';
    var get = function (name) {
        var val = localStorage.getItem(this._keyString + name);
        return WinJS.Promise.as(val);
    };
    var set = function (name, value) {
        var val = localStorage.setItem(this._keyString + name, value);
        return WinJS.Promise.as(val);
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
        var val = localStorage.removeItem(this._keyString + name);
        return WinJS.Promise.as(val);
    };

    WinJS.Namespace.define("MED.LocalStorage", {
        getItem: get,
        setItem: set,
        getPrefix: getPrefix,
        init: init,
        removeItem: remove
    });
})();