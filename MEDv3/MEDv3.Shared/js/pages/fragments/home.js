(function () {
    "use strict";
    var Page = WinJS.UI.Pages.define("/pages/fragments/home.html", {
        init: function (element, options) {
            this._element = element;
            this._options = options;
            this.data = WinJS.Binding.as({ motd: 'test test' });
        },
        ready: function (element, options) {
            var me = this;
            me.renderLibrary();
            me.renderDownloads();
            MED.Server.syncManager.addEventListener('synced', me.renderLibrary.bind(this));
            WinJS.Binding.processAll(element, this.data);
        },
        unload: function () {
            MED.Server.syncManager.removeEventListener('synced', this.renderLibrary);
        },
        renderDownloads: function () {
            var me = this;
            var downloadsHost = WinJS.Utilities.query('.b_home--downloads', me._element)[0];
            var favorites

            MED.Server.getFavoriteMedias().done(function (res) {
                favorites = res.items || [];

                WinJS.UI.Pages.render('/pages/view/library.html', downloadsHost, {
                    content: favorites,
                    filter: 'favorite'
                }).done(function ok() {
                    WinJS.UI.Animation.enterPage(downloadsHost);
                });
            });
          
        },
        renderLibrary: function () {
            var me = this;
            var data = MED.LocalStorage.getItem('data');
            
            this.data.motd = data._value ? JSON.parse(MED.LocalStorage.getItem('data')._value).motd : '';
            MED.Server.getFolderById(0).done(function (res) {
                var items = res ? res.items : [];
                me.item = res;
                var listViewHost = WinJS.Utilities.query('.b_home--libraries', me._element)[0];
                if (!listViewHost) {
                    return false;
                }
                listViewHost.innerHTML = '';

                WinJS.UI.Pages.render('/pages/view/library.html', listViewHost, { content: items }).done(function ok() {
                    WinJS.UI.Animation.enterPage(listViewHost);
                });

            });
        }
    });

})();