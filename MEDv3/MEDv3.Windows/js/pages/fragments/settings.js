(function () {
    "use strict";
    var Page = WinJS.UI.Pages.define("/pages/fragments/settings.html", {
        ready: function (element, options) {
            var toggleField = WinJS.Utilities.query('.b_settings--wrapper__toggle', element)[0].winControl;
            var autoSync = JSON.parse(MED.Settings.get('autoSync'));

            toggleField._setChecked(autoSync);
            toggleField.addEventListener('change', function (e) {
                var checked = e.currentTarget.winControl.checked;
                MED.Settings.set('autoSync', checked);
            })
        },
        unload: function () {
            
        }
    });

})();