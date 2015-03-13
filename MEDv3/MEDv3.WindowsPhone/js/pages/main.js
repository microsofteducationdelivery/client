(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/main.html", {
        ready: function (element, options) {
            MED.LocalStorage.init();
            MED.Downloads.init();
            WinJS.UI.processAll(element);
            document.getElementById('btn-settings').addEventListener('click', function () {
                WinJS.Navigation.navigate('/pages/settings.html');
            });


        }
    });
})();