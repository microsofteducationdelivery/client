(function () {
    'use strict';

    var PageConstructor = WinJS.UI.Pages.define('/pages/fragments/downloads.html', {
        init: function () {
            this.data = WinJS.Binding.as({ motd: '&nbsp;' });
        },
        ready: function (element) {
            var me = this;
            this.element = element;
            WinJS.Utilities.query('.b_downloads--navbar__link', element).listen('click', function (e) {
                e.preventDefault();
                var link = e.target;
                
                me.navigate(link.nameProp);
            });

            WinJS.Utilities.query('.b_downloads--cancel_all', element).listen('click', function (e) {
                e.preventDefault();
                var inputs = WinJS.Utilities.query('input', element);
                cancelAll(inputs.map(function (input) {
                    return input.name;
                }));
            });

            this.navigate('inprogress');
            this.data.motd = MED.LocalStorage.getItem('motd');

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
    function cancelAll(ids) {
        if (!ids || ids.length === 0) {
            return;
        }
        var deleteInvokedHandler = function (command) {
            ids.forEach(function (id) {
                MED.Downloads.remove(id);
            });  
        }
        var msg = new Windows.UI.Popups.MessageDialog(
            "Do you realy want to cancel all downloads?");

        msg.commands.append(new Windows.UI.Popups.UICommand("Cancel"));
        msg.commands.first().current.invoked = deleteInvokedHandler;
        msg.commands.append(
            new Windows.UI.Popups.UICommand("Close"));

        // Set the command that will be invoked by default
        msg.defaultCommandIndex = 0;

        // Set the command to be invoked when escape is pressed
        msg.cancelCommandIndex = 1;

        // Show the message dialog
        msg.showAsync();
    }
 /*   var Links = WinJS.Class.define(function (params) {
        this.page = params.page;
        this.title = params.title;
    });
    var links = [
            { page: 'all', title: 'All' },
            { page: 'downloaded', title: 'Complete' },
            { page: 'inprogress', title: 'In Progress' }];
    */
   
    WinJS.Namespace.define('Downloads', {
    //    links: new WinJS.Binding.List(links.map(function (link) { return new Links(link); })),
        page: PageConstructor
    });
})()