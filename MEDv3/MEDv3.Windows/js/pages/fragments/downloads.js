(function () {
    'use strict';

    var PageConstructor = WinJS.UI.Pages.define('/pages/fragments/downloads.html', {
        ready: function (element) {
            var me = this;
            this.element = element;
            WinJS.Utilities.query('.b_downloads--navbar__link', element).listen('click', function (e) {
                e.preventDefault();
                var link = e.target;
                
                me.navigate(link.nameProp);
            });

            this.navigate('all');
        },
        navigate: function (page) {
            WinJS.Utilities.query('.b_downloads--navbar__link-active', this.element).removeClass('b_downloads--navbar__link-active');
            WinJS.Utilities.query('a[href="' + page + '"]', this.element).addClass('b_downloads--navbar__link-active');

            var listViewHost = WinJS.Utilities.query('.b_downloads--list', this.element)[0];
            listViewHost.innerHTML = '';

            WinJS.UI.Pages.render('/pages/view/download.html', listViewHost, {page: page}).done(function ok() {
                WinJS.UI.Animation.enterPage(listViewHost);
            })
        }
    });
    var Links = WinJS.Class.define(function (params) {
        this.page = params.page;
        this.title = params.title;
    });
    var links = [
            { page: 'all', title: 'All' },
            { page: 'downloaded', title: 'Complete' },
            { page: 'inprogress', title: 'In Progress' }];

   
    WinJS.Namespace.define('Downloads', {
        links: new WinJS.Binding.List(links.map(function (link) { return new Links(link); })),
        page: PageConstructor
    });
})()