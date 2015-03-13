(function () {
    "use strict";
    var Page = WinJS.UI.Pages.define("/pages/fragments/downloads.html", {
        init: function () {
            this._tapHandler = this.handleTap.bind(this);
        },
        handleTap: function (event) {
            if (this.isHold) {
                return this.isHold = false;
            }
            event.detail.itemPromise.then(function (item) {
                if (item.data.completed) {
                    console.debug('gotopage');
                    WinJS.Navigation.navigate('/pages/media.html', item.data);
                } else {
                    cancelDownload({id: item.data.id});
                }
            });
        },
        ready: function (element, options) {
            var me = this;
            WinJS.UI.processAll(element);
            this._list = element.querySelector('.b-library__list').winControl;
            this._list.itemDataSource = MED.Downloads.list.dataSource;
            var gestureObject = new MSGesture();
            var realTarget;
            var list = element.querySelector('.b-library__list');

            gestureObject.target = list;
            list.gestureObject = gestureObject;
            list.addEventListener("pointerdown", function (e) {
                realTarget = e.target;
                e.currentTarget.gestureObject.addPointer(e.pointerId);
            });
            list.addEventListener('MSGestureHold', function (event) {
                event.preventDefault();
                if (event.detail === 2) {
                    return false;
                }
                me.isHold = true;
                var el = me.getItem(realTarget);
                if (el) {
                    var id = el.el.querySelector('input').name;
                    cancelDownload({ id: id });
                }
                console.log(realTarget);
            });
            this._list.addEventListener('iteminvoked', this._tapHandler);
        },
        getItem: function (element) {
            var result = false;
            while (element) {
                if (element.className === 'b-media__item') {
                    result = { type: 'media', el: element };
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
    WinJS.Namespace.define("MED.Pages", {
        Downloads: Page
    });
    WinJS.Namespace.define("MED.Pages.ViewHelpers.Downloads", {
        preview: WinJS.Binding.converter(function (id) {
            var currentServerId = MED.Settings.get('currentServerId');
            return 'ms-appdata:///local/' + MED.LocalStorage.getPrefix() + '-preview-' + id + '.png';
        }),
        percents: WinJS.Binding.converter(function (value) { return Math.round(value * 100); }),
        isIncompleteInline: WinJS.Binding.converter(function (value) {
            return value !== 1 ? 'inline' : 'none'
        }),
        isIncompleteBlock: WinJS.Binding.converter(function (value) {
            return value !== 1 ? 'block' : 'none'
        }),
        isComplete: WinJS.Binding.converter(function (value) { return value === 1 ? 'block' : 'none' })       
    });

})();