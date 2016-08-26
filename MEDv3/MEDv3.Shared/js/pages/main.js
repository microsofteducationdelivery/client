(function () {
    "use strict";

    function windowResizeListener() {
        var button = document.querySelector('.b_main--split-view');
        var splitView = document.querySelector('.splitView');
        if (!button || !splitView) { return; }

        if (button && button.offsetLeft > 0) {
            splitView.winControl.closedDisplayMode = 'none';
        } else {
            splitView.winControl.closedDisplayMode = 'inline';
        }

        var lists = document.querySelectorAll('.win-listview');
        for (var i = 0; i < lists.length; i++) {
            lists[i].winControl.forceLayout();
        }
    }

    var Page = WinJS.UI.Pages.define("/pages/main.html", {

        init: function () {
            this._dataPromise = MED.Server.getCachedData();
           // this.data = WinJS.Binding.as({ motd: '&nbsp;' });
            this._syncListener = this.sync.bind(this);
            MED.Downloads.init();
            
        },

        ready: function (element, options) {

            windowResizeListener();
            window.addEventListener('resize', windowResizeListener);

            this.initSlider(element);
            WinJS.Application.addEventListener('med.back_slide', function (e) {
                if (WinJS.Navigation.canGoBack) {
                    WinJS.Navigation.back();
                }
            });
            var me = this;
            var autoSync = JSON.parse(MED.Settings.get('autoSync'));
            if (autoSync) {
                this.sync();
            }
            
            WinJS.Utilities.query('.action-sync', element).listen('click', function () {
                element.querySelector('.splitView').winControl.closePane();
                me.sync();
            });

            WinJS.Utilities.query('.action-logout', element).listen('click', function () {
                me.logout();
            });

            WinJS.Utilities.query('.action-nav', element).listen('click', function (e) {
                element.querySelector('.splitView').winControl.closePane();
                WinJS.Navigation.navigate(this.dataset.url);
            });

            WinJS.Binding.processAll(element, this.data);
            WinJS.UI.processAll(element);
        },
        logout: function () {
            var loginContent = document.getElementById('contenthost')

            if (loginContent && loginContent.winControl) {
                loginContent.winControl.dispose();
            }
            MED.Server.clearCachedData();
            var contentHost = document.getElementById('page');
            contentHost.innerHTML = '';
            MED.Settings.set('loggedIn', false);
            ['login', 'password'].forEach(function (field) {
                MED.SecureSettings.remove(field);
            });

            WinJS.UI.Pages.render('/pages/login.html', contentHost, {}).done(function ok() {});
        },
        sync: function () {
            var that = this;
            if (this._syncPromise) {
                return;
            }

            MED.ProgressBar.show();

            this._syncPromise = true;
            MED.Server.loadData().then(function ok(data) {
                MED.ProgressBar.hide();
                MED.Server.syncManager.sync();
                that._syncPromise = false;
            }, function error(reason) {
                MED.ProgressBar.hide();
                that._syncPromise = false;
                if (reason instanceof XMLHttpRequest && reason.status === 401) {
                    var msgBox = new Windows.UI.Popups.MessageDialog('Auth failed. Please login again');
                    msgBox.showAsync().then(function () { WinJS.Application.logout() });
                } else {
                    if (reason.number === -2147024891) { return; }
                    var msgBox = new Windows.UI.Popups.MessageDialog('Sync failed. Check your Internet connection');
                    msgBox.showAsync();
                }
            });
        }
    });

    WinJS.Class.mix(Page, MED.Mixins.Slideable);
    
})();