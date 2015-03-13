(function () {
    "use strict";
    var defaultSettings = {
        autoSync: false,
    };
    for (var key in defaultSettings) {
        if (typeof get(key) === 'undefined') {
            set(key, defaultSettings[key]);
        }
    }


    function get(key) {
        return localStorage.getItem(key);
    };

    function set(key, value) {
        localStorage.setItem(key, value);
    };

    function init() {
    };

    WinJS.Namespace.define("MED.Settings", {
        get: get,
        set: set
    });
})();