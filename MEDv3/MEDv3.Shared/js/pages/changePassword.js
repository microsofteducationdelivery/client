(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/view/changePassword.html", {
        ready: function (element, options) {
            var form = element.querySelector('form');
            var msgBox;

            WinJS.Utilities.query('.b-change_password__btn', element).listen('click', function (e) {
                e.preventDefault();
                if (form.password.value !== form.repeatPassword.value) {
                    msgBox = new Windows.UI.Popups.MessageDialog('Passwords does not mutch');
                    msgBox.showAsync();
                    return;
                }
                if (!form.password.value || !form.oldPassword.value) {
                    msgBox = new Windows.UI.Popups.MessageDialog('Fields are empty');
                    msgBox.showAsync();
                    return;
                }
                MED.ProgressBar.show();
                MED.Service.Auth.changePassword({
                    oldPassword: form.oldPassword.value,
                    newPassword: form.password.value
                }).then(function () {
                    MED.ProgressBar.hide();
                    WinJS.Navigation.back(1);
                }, function (e) {
                    MED.ProgressBar.hide();
                    var msgBox = new Windows.UI.Popups.MessageDialog('Password changing failed: ' + e.responseText);
                    msgBox.showAsync();
                });

            });
        }
    });
})();