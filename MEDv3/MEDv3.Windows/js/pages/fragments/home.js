(function () {
    "use strict";
    var Page = WinJS.UI.Pages.define("/pages/fragments/home.html", {
        init: function (element, options) {
            this._element = element;
            this._options = options;
        },
        ready: function (element, options) {
            var me = this;
            me.renderLibrary();
            me.renderDownloads();
            MED.Server.syncManager.addEventListener('synced', me.renderLibrary);
        },
        unload: function () {
            MED.Server.syncManager.removeEventListener('synced', this.renderLibrary);
        },
        renderDownloads: function () {
            var me = this;
            var downloadsHost = WinJS.Utilities.query('.b_home--downloads', me._element)[0];
            WinJS.UI.Pages.render('/pages/view/download.html', downloadsHost).done(function ok() {
                WinJS.UI.Animation.enterPage(downloadsHost);
            });
        },
        renderLibrary: function () {
            var me = this;
            MED.Server.getFolderById(0).done(function (res) {
                var items = res ? res.items : [];
                me.item = res;
                var listViewHost = WinJS.Utilities.query('.b_home--libraries', me._element)[0];
                listViewHost.innerHTML = '';

                WinJS.UI.Pages.render('/pages/view/library.html', listViewHost, { content: items }).done(function ok() {
                    WinJS.UI.Animation.enterPage(listViewHost);
                });

            });
        }
    });

})();