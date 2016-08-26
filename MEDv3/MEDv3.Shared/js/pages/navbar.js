(function () {
    'use strict';

    var PageConstructor = WinJS.UI.Pages.define('/pages/navbar.html', {
        ready: function (element) {
            WinJS.Binding.processAll(element, {
                user: WinJS.Application.sessionState.user
            });

            WinJS.Utilities.query('a', element).listen('click', function (event) {
                event.preventDefault();
                WinJS.Navigation.navigate(event.target.href);

            });
            WinJS.Navigation.onnavigated = navigationHandler;
            WinJS.Utilities.query('button.b-navigation-footer__logout', element).listen('click', function (event) {
                localStorage.removeItem('token');
                window.location = '/default.html';
            });
        }
    });
    var links = [
            { page: '/pages/fragments/home.html', title: 'Home' },
            { page: '/pages/fragments/libraries.html', title: 'Libraries' },
            { page: '/pages/fragments/downloads.html', title: 'Downloads' },
            { page: '/pages/fragments/settings.html', title: ' &#xe115;' }];
    var navigationHandler = function (e) {
        var location = e.detail.location;

        links.forEach(function (link) {
            if (location.search(link.page) !== -1) {
                WinJS.Utilities.query('.b-navigation__link').removeClass('b-navigation__link-active');
                WinJS.Utilities.query('.b-navigation__link[href="' + link.page + '"]').addClass('b-navigation__link-active');
            }
        });
        
    }
    var Links = WinJS.Class.define(function (params) {
        this.page = params.page;
        this.title = params.title;
    });
    WinJS.Namespace.define('NavBar', {
        links: new WinJS.Binding.List(links.map(function (link) { return new Links(link); })),
        page: PageConstructor
    });
})()