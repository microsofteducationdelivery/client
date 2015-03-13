(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/settings.html", {
        ready: function (element, options) {
            WinJS.UI.processAll(element).then(function () {
                document.getElementById('appbar').winControl.showOnlyCommands(['btn-help', 'btn-logout']);
                document.getElementById('btn-logout').winControl.addEventListener('click', function () {
                    WinJS.Application.logout();
                });
                var autoSyncToggle = element.querySelector('#autosynctoggle').winControl;
                
                autoSyncToggle.checked = MED.Settings.get('autoSync');
                
                autoSyncToggle.addEventListener('change', function (event) {
                    MED.Settings.set('autoSync', autoSyncToggle.checked);
                });
            });
        }
    });
})();