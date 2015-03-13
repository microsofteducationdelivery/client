(function () {
    "use strict";

    function show() {
        document.getElementById('progress').style.visibility = 'visible';
    }

    function hide() {
        document.getElementById('progress').style.visibility = 'hidden';
    }

    WinJS.Namespace.define("MED.ProgressBar", {
        hide: hide,
        show: show
    });
})();