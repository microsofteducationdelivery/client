(function () {
    "use strict";

    function show() {
        document.querySelector('.progress-container').classList.add('inProgress');
    }

    function hide() {
        document.querySelector('.progress-container').classList.remove('inProgress');
    }

    WinJS.Namespace.define("MED.ProgressBar", {
        hide: hide,
        show: show
    });
})();