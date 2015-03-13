(function () {
    "use strict";
    var Page = WinJS.UI.Pages.define("/pages/fragments/libraries.html", {

        init: function () {
            this._dataPromise = MED.Server.getCachedData();
            this.data = WinJS.Binding.as({ motd: 'hello', items: new WinJS.Binding.List([]) });
            this._syncListener = this.sync.bind(this);
        },
        
        ready: function (element, options) {
            var me = this;

            WinJS.Binding.processAll(element, this.data);
            WinJS.UI.processAll(element).then(function () {
                document.getElementById('appbar').winControl.showOnlyCommands(['btn-help', 'btn-sync', 'btn-settings']);
                document.getElementById('btn-sync').addEventListener('click', this._syncListener);
                this._list = element.querySelector('.b-library__list').winControl;
                var list = element.querySelector('.b-library__list');

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
                    if (event.detail === 2) {
                        return false;
                    }
                    me.isHold = true;
                    var el = me.getItem(realTarget);
                    if (el && el.type === 'folder') {
                        var id = el.el.querySelector('input').name;
                        me.downloadAll({ id: id });
                    }
                    console.log(realTarget);
                });

                this._list.addEventListener('iteminvoked', function (event) {
                    if (me.isHold) {
                        return me.isHold = false;
                    }
                    event.detail.itemPromise.then(function (item) {
                        WinJS.Navigation.navigate('/pages/library.html', { id: item.data.id });
                    });
                });
            }.bind(this));
        },
        getItem: function (element) {
            var result = false;
            while (element) {
                if (element.className === 'b-library__folder') {
                    result = { type: 'folder', el: element };
                    break;
                }
                if (element.className === 'b-media__item') {
                    result = { type: 'media', el: element };
                    break;
                }
                element = element.parentNode;
            }
            return result;
        },
        downloadAll: function (config) {
            var downloadHandler = function (command) {
                MED.Downloads.add({
                    id: config.id,
                    type: 'folder'
                });
            }
            var msg = new Windows.UI.Popups.MessageDialog(
                "All items will be downloaded");

            msg.commands.append(new Windows.UI.Popups.UICommand("Ok"));
            msg.commands.first().current.invoked = downloadHandler;
            msg.commands.append(
                new Windows.UI.Popups.UICommand("Close"));

            // Set the command that will be invoked by default
            msg.defaultCommandIndex = 0;

            // Set the command to be invoked when escape is pressed
            msg.cancelCommandIndex = 1;

            // Show the message dialog
            msg.showAsync();
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

                that._syncPromise = false;
                that.data.motd = data.motd;
                that.data.items = new WinJS.Binding.List(data.data[0].items);

                //FIXME: awful hack
                if (that.element) {
                    that._list.itemDataSource = that.data.items.dataSource;
                }
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
        },

        processed: function (element, options) {
            var that = this;

            this._dataPromise.then(function ok(data) {
                if (data) {
                    that.data.motd = data.motd;
                    that.data.items = new WinJS.Binding.List(data.data[0].items)

                    //FIXME: awful hack
                    that._list = element.querySelector('.b-library__list').winControl;

                    that._list.itemDataSource = that.data.items.dataSource;
                }
                if (MED.Settings.get('autoSync')) {
                    that.sync();
                }
            });
        },

        unload: function () {
            document.getElementById('btn-sync').removeEventListener('click', this._syncListener);
            if (this._syncPromise) {
                this._syncPromise.cancel();
            }
        }
    });

    WinJS.Namespace.define("MED.Pages", {
        Libraries: Page
    });

    WinJS.Namespace.define("MED.Pages.ViewHelpers.Library", {
        isLibraryEmpty: WinJS.Binding.converter(function (items) {
            return !items.length ? 'block' : 'none';
        }),
        isLibraryNotEmpty: WinJS.Binding.converter(function (items) {
            return items.length ? 'block' : 'none';
        }),

        itemsCount: WinJS.Binding.converter(function (count) {
            count = ~~count;
            return count === 1 ? (count + ' item') : (count + ' items')
        })

    });

})();