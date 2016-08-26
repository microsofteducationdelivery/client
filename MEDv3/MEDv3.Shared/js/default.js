(function () {
    "use strict";

    var activation = Windows.ApplicationModel.Activation;
    var app = WinJS.Application;
    var nav = WinJS.Navigation;
    var sched = WinJS.Utilities.Scheduler;
    var ui = WinJS.UI;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind == Windows.ApplicationModel.Activation.ActivationKind.protocol) {
            var contentHost = document.getElementById('contenthost');
            var helpBtn = document.getElementById('btn-help');
            if (helpBtn) {
                helpBtn.addEventListener('click', function () {
                    MED.Help.show();
                });

            }

            var token = MED.Settings.get('token');
            if (!token) {
                MED.Settings.set('loggedIn', false);
            }

            var loginContent = document.getElementById('contenthost')

            if (loginContent && loginContent.winControl) {
                loginContent.winControl.dispose();
            }
            contentHost.innerHTML = '';
            if (JSON.parse(MED.Settings.get('loggedIn'))) {
                MED.LocalStorage.init();
                return WinJS.UI.Pages.render('/pages/main.html', contentHost, {}).then(function ok() {
                    return nav.navigate(nav.location || Application.navigator.home, nav.state);
                });
            } else {
                return WinJS.UI.Pages.render('/pages/login.html', contentHost, {});
            }
        } else if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {

                // TODO: Это приложение было вновь запущено. Инициализируйте
                // приложение здесь.
            } else {
                // TODO: Это приложение вновь активировано после приостановки.
                // Восстановите состояние приложения здесь.
            }

            hookUpBackButtonGlobalEventHandlers();
            nav.history = nav.history.backStack.length ? nav.history : (app.sessionState.history || {});
            nav.history.current.initialPlaceholder = true;

            // Оптимизация загрузки приложений и выполнение запланированных задач с высоким приоритетом во время отображения экрана-заставки.
            ui.disableAnimations();

            var contentHost = document.getElementById('contenthost');
            var p = ui.processAll().then(function () {
                var helpBtn = document.getElementById('btn-help');
                if (helpBtn) {
                    helpBtn.addEventListener('click', function () {
                        MED.Help.show();
                    });

                }
           
                var token = MED.Settings.get('token');
                if (!token) {
                    MED.Settings.set('loggedIn', false);
                }

                var loginContent = document.getElementById('contenthost')

                if (loginContent && loginContent.winControl) {
                    loginContent.winControl.dispose();
                }
                contentHost.innerHTML = '';
                if (JSON.parse(MED.Settings.get('loggedIn'))) {
                    MED.LocalStorage.init();
                    return WinJS.UI.Pages.render('/pages/main.html', contentHost, {}).then(function ok() {
                        return nav.navigate(nav.location || Application.navigator.home, nav.state);
                    });
                } else {
                    return WinJS.UI.Pages.render('/pages/login.html', contentHost, {});
                }
            }).then(function () {
                return sched.requestDrain(sched.Priority.aboveNormal + 1);
            }).then(function () {
                ui.enableAnimations();
                return WinJS.UI.Animation.enterPage(contentHost);
            });

            args.setPromise(p);
        } 
    });

    app.oncheckpoint = function (args) {
        // TODO: Это приложение будет приостановлено. Сохраните здесь все состояния,
        // которые необходимо сохранять во время приостановки. Если необходимо 
        // завершить асинхронную операцию, прежде чем приложение 
        // будет приостановлено, вызовите args.setPromise().
        app.sessionState.history = nav.history;
    };

    function hookUpBackButtonGlobalEventHandlers() {
        window.addEventListener('keyup', backButtonGlobalKeyUpHandler, false)
    }

    var KEY_LEFT = "Left";
    var KEY_BROWSER_BACK = "BrowserBack";
    var MOUSE_BACK_BUTTON = 3;

    function backButtonGlobalKeyUpHandler(event) {
        if ((event.key === KEY_LEFT && event.altKey && !event.shiftKey && !event.ctrlKey) || (event.key === KEY_BROWSER_BACK)) {
            nav.back();
        }
    }

    app.logout = function () {
        MED.Settings.set('loggedIn', false);
        MED.Server.clearCachedData();

        var contentHost = document.getElementById('contenthost');
        if (contentHost.winControl) {
            contentHost.winControl.dispose();
        }
        
        contentHost.innerHTML = '';
        WinJS.UI.Pages.render('/pages/login.html', contentHost, {}).done(function ok() {
            WinJS.UI.Animation.enterPage(contentHost);
            WinJS.Navigation.history = {};
        })
    }

    app.start();
})();
