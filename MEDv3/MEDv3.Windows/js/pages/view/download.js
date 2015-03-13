(function () {
    
    'use strict';

    WinJS.UI.Pages.define('/pages/view/download.html', {
        init: function () {
            this._tapHandler = this.handleTap.bind(this);
        },
        handleTap: function (event) {
            if (this.isHold) {
                this.isHold = false;
                return false;
            }
            event.detail.itemPromise.then(function (item) {
                if (item.data.completed) {
                    WinJS.Navigation.navigate('pages/media.html', { id: item.data.id, subtype: item.data.subtype });
                } else {
                    cancelDownload({ id: item.data.id });
                }
            });
        },

        ready: function (element, options) {
            var me = this;
            var page = options ? options.page || 'all' : 'all';

            this._list = WinJS.Utilities.query('#downloads-list', element)[0].winControl;
            this._list.itemDataSource = MED.Downloads.getFilterData(page).dataSource;
            //this._list.itemDataSource = MED.Downloads.list.dataSource;

            this._list.addEventListener('iteminvoked', this._tapHandler);
            var list = element.querySelector('#downloads-list');
            var gestureObject = new MSGesture();
            var realTarget;

            gestureObject.target = list;
            list.gestureObject = gestureObject;
            list.addEventListener("pointerdown", function (e) {
                realTarget = e.target;
                e.currentTarget.gestureObject.addPointer(e.pointerId);
            });
            list.addEventListener('MSGestureHold', function (event) {
                event.preventDefault();
                if (me.isHold === true) {
                    return false;
                }
                me.isHold = true;
                var el = me.getItem(realTarget);
                if (el) {
                    var id = el.el.querySelector('input').name;
                    cancelDownload({ id: id });
                }
                console.log(realTarget);
            }, false);
        },
        getItem: function (element) {
            var result = false;
            while (element) {
                if (element.className === 'b_download-tpl--item') {
                    result = { el: element };
                    break;
                }
              
                element = element.parentNode;
            }
            return result;
        },
        unload: function () {
            this._list.removeEventListener('iteminvoked', this._tapHandler);
        }
    });
    function cancelDownload(config) {
        var deleteInvokedHandler = function (command) {
            MED.Downloads.remove(config.id);
        }
        var msg = new Windows.UI.Popups.MessageDialog(
            "Do you realy whant to delete this item?");

        msg.commands.append(new Windows.UI.Popups.UICommand("Delete"));
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

   
    WinJS.Namespace.define("MED.Download", {
        preview: WinJS.Binding.converter(function (id) {
            var currentServerId = MED.LocalStorage.getPrefix();
            return 'ms-appdata:///local/' + currentServerId + '-preview-' + id + '.png';
        }),
        getWidth: WinJS.Binding.converter(function (percent) {
            percent = (percent * 100) | 0;
            return (6 + (percent * 0.4)) + '%';
        }),
        getBarClass: WinJS.Binding.converter(function (percent) {
            percent = (percent * 100) | 0;
            return percent.toString() !== '100' ? 'b_download-tpl--item__percent-bar' : 'b_download-tpl--item__complete-bar';
        }),
        getPercent: WinJS.Binding.converter(function (percent) {
            percent = (percent * 100) | 0;
            return percent + '%';
        })
    });
})();


