(function () {
    'use strict';

    var PageConstructor = WinJS.UI.Pages.define('/pages/fragments/libraries.html', {
        init: function (element, options) {
            this.element = element;
            var id = options ? options.id || 0 : 0;
            this.path = MED.Server.getPath(id);

            WinJS.Namespace.define("MED.Library", {
                path: new WinJS.Binding.List(this.path)
            });

            var syncHandler = function () {
                this.data.motd = JSON.parse(MED.LocalStorage.getItem('data')._value).motd;
                WinJS.Navigation.navigate('/pages/fragments/libraries.html', {
                    id: id
                });
            }.bind(this);

            this._syncHandler = syncHandler;
        },
        unload: function () {
            MED.Server.syncManager.removeEventListener('synced', this._syncHandler);
        },
        ready: function (element, options) {
            if (options && options.title) {
                element.querySelector('h1').textContent = options.title;
            } else {
                element.querySelector('h1').textContent = 'Libraries';
            }

            this.data = WinJS.Binding.as({ motd: '&nbsp;' });

            var me = this,
                filtersLink = WinJS.Utilities.query('.b_downloads--navbar__link', element),
                id = options ? options.id || 0 : 0,
                filterLinks = WinJS.Utilities.query('.b_downloads--navbar__link', element)
            ;
            MED.Server.syncManager.addEventListener('synced', this._syncHandler);
            var linkHandler = function (e) {
                e.preventDefault();
                var link = e.target;
                WinJS.Navigation.navigate('/pages/fragments/libraries.html', {
                    id: link.nameProp
                });
            };
            var filterHandler = function (e) {
                var link = e.target;
                e.preventDefault();
                 WinJS.Navigation.navigate('/pages/fragments/libraries.html', {
                    id: link.nameProp,
                    isFilter: true
                });
            };

            if (options && (options.id === 'all' || options.id === 'favorites')) {
                WinJS.Utilities.query('.b_downloads--navbar__link[href="' +id + '"]', element).addClass('b_downloads--navbar__link-active');
                MED.Server.getFiltredata(options.id).then(function (data) {
                    console.log(data.items);
                    me.item = data;
                    me.renderList(me.item.items);
                });
            } else {
                WinJS.Utilities.query('.b_downloads--navbar__link[href="all"]', element).addClass('b_downloads--navbar__link-active');
                MED.Server.getFolderById(id).done(function (res) {
                    me.item = res;
                    me.renderList(me.item ? me.item.items : []);
                });

            }

            if (this.path.length > 0) {
                WinJS.Utilities.query('.b_downloads--navbar', element).addClass('hidden');
                WinJS.Utilities.query('.b_libraries--path__link', element).listen('click', linkHandler);

            } else {
                WinJS.Utilities.query('.b_downloads--navbar__link', element).listen('click', filterHandler);
            }
            WinJS.Binding.processAll(element, this.data);
            var data = MED.LocalStorage.getItem('data');

            this.data.motd = data._value ? JSON.parse(MED.LocalStorage.getItem('data')._value).motd : '';
        },
        renderList: function (data) {
            var listViewHost = WinJS.Utilities.query('.b_libraries--list', this.element)[0];
            listViewHost.innerHTML = '';

            WinJS.UI.Pages.render('/pages/view/library.html', listViewHost, { page: page, content: data}).done(function ok() {
                WinJS.UI.Animation.enterPage(listViewHost);           
            });
        },
        listview: null,
        currentItem: null, 
        navigate: function (id) {
            WinJS.Navigation.navigate('/pages/fragments/libraries.html', {
                id: id
            });
        }
    });
 
    var Links = WinJS.Class.define(function (params) {
        this.page = params.page;
        this.title = params.title;
    });
    var links = [
            { page: 'all', title: 'All' },
            { page: 'favorites', title: 'Favorites' }];

    WinJS.Namespace.define('Libraries', {
        links: new WinJS.Binding.List(links.map(function (link) { return new Links(link); })),
        page: PageConstructor,
        getFavorite: WinJS.Binding.converter(function (id) {
            var className = 'b_library-tpl--item__star';
        /*  if (id.toString().search('library') === -1) {
            return 'hidden';
        }*/
            var isFav = MED.Server.getFavorite(id);
            if (isFav === -1) {
                return '';
            }
            className += isFav ? ' favorite' : ' unfavorite';
            return className;
        }),
        getStatus: WinJS.Binding.converter(function (id) {
            var details = MED.Downloads.getDetails(id);
            return details ? 'downloaded' : 'not downloaded';
        })
    });
})()