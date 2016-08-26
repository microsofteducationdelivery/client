(function () {
    "use strict";
    var Page = WinJS.UI.Pages.define("/pages/fragments/settings.html", {
        ready: function (element, options) {
            var toggleField = WinJS.Utilities.query('.b_settings--wrapper__toggle', element)[0].winControl;
            var autoSync = JSON.parse(MED.Settings.get('autoSync'));
            var changePasswordBtn = element.querySelector('.b-settings--btn');

            toggleField._setChecked(autoSync);
            toggleField.addEventListener('change', function (e) {
                var checked = e.currentTarget.winControl.checked;
                MED.Settings.set('autoSync', checked);
            });
            if (!changePasswordBtn) {
                return;
            }
            changePasswordBtn.addEventListener('click', function () {
                WinJS.Navigation.navigate('/pages/view/changePassword.html');
            });
        },
        unload: function () {
            
        }
    });

})();