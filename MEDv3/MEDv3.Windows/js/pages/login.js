(function () {

    "use strict";

    WinJS.UI.Pages.define("/pages/login.html", {

        ready: function (element, options) {
            var form = element.querySelector('form');
            ['login', 'password', 'server'].forEach(function (field) {
                MED.SecureSettings.get(field).then(function (value) {
                    if (value && form.length) {
                        form[field].value = value;
                        form.rememberme.checked = true;
                        form.accept.checked = true;
                        element.querySelector('button').removeAttribute('disabled');
                    }
                });
            });
            WinJS.Utilities.query('input[name=accept]', element).listen('click', function (e) {
                if (e.target.checked) {
                    element.querySelector('button').removeAttribute('disabled');
                } else {
                    element.querySelector('button').setAttribute('disabled', true);
                }
            });

            WinJS.Utilities.query('button', element).listen('click', function (e) {
                e.preventDefault();

                var contentHost = document.getElementById('page');
                MED.ProgressBar.show();
                MED.Server.login({
                    login: form.login.value,
                    password: form.password.value,
                    server: form.server.value,
                    rememberme: form.rememberme.checked 
                }).then(function ok(req) {
                    var loginContent = WinJS.Utilities.query('#contenthost');
                    loginContent.forEach(function (item) {
                        if (item.winControl) {
                            item.winControl.dispose();
                        }
                    });
                                    
                    MED.ProgressBar.hide();
                   
                    contentHost.innerHTML = '';
                    WinJS.UI.Pages.render('/pages/main.html', contentHost, {}).done(function ok() {

                        WinJS.UI.Animation.enterPage(contentHost);
                        WinJS.Navigation.navigate(Application.navigator.home);
                    })
                }, function error() {
                    MED.ProgressBar.hide();
                    var msgBox = new Windows.UI.Popups.MessageDialog('Unable to login');
                    msgBox.showAsync();
                });
            });
        }
    });
})();