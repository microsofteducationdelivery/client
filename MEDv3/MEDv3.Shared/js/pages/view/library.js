(function () {

    'use strict';

    WinJS.UI.Pages.define('/pages/view/library.html', {
        ready: function (element, options) {
            var me = this;
            var isHold = false;

            var libraryTemplate = document.getElementById('lib-tpl').winControl;
            var mediaTemplate = document.getElementById('media-tpl').winControl;
            var listview = element.querySelector('#libraries-list', element).winControl;
            var filter = options.filter || '';
            var renderer = function (itemPromise) {
                return itemPromise.then(function (item) {
                    switch (item.data.type) {
                        case 'folder':
                            return libraryTemplate.renderItem(itemPromise);
                        case 'media':
                            return mediaTemplate.renderItem(itemPromise);
                        default:
                            throw new Error('Unknown type');
                    }
                });
            };
            listview.itemTemplate = renderer;
            var listItems = new WinJS.Binding.List(options.content)
            listview.itemDataSource = (new WinJS.Binding.List(options.content)).dataSource;
          
            var list = element.querySelector('#libraries-list');

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
                if (el && el.type === 'folder') {
                    var id = el.el.querySelector('input').name;
                    me.downloadAll({ id: id });
                }
                console.log(realTarget);
            });

            WinJS.Utilities.query('#libraries-list', element).listen('click', function (e) {
                if (isHold) {
                    return isHold = false;
                }
                var list = e.target.classList,
                    item = me.getItem(e.target),
                    favorite,
                    id;

                if (!item) {
                    return false;
                }
                id = (item.el.querySelector('.b_library-tpl__id') || item.el.querySelector('.b_media-tpl__id')).name;
                if (list[0] === 'b_library-tpl--item__star') {
                    favorite = list[1];
                    var favorite = favorite === 'unfavorite';
                    MED.Server.setFavorite(id, favorite);
                    favorite ? e.target.className = 'b_library-tpl--item__star favorite' : e.target.className = 'b_library-tpl--item__star unfavorite';
                    if (!favorite && filter === 'favorite') {
                        var listItem = listItems.filter(function (i) {
                            return i.id.toString() === id;
                        })[0];
                        listItems.splice(listItems.indexOf(listItem), 1);
                        listview.itemDataSource = listItems.dataSource;
                    }
                } else if (item.type === 'media') {
                    var preview = item.el.querySelector('.b_media-tpl--img').src;
                    if (MED.Downloads.isDownloaded(id)) {
                        WinJS.Navigation.navigate('/pages/media.html', MED.Downloads.getDetails(id));
                        return;
                    }

                    if (MED.Downloads.isBeingDownloaded(id)) {
                        var msgBox = new Windows.UI.Popups.MessageDialog('Error: already queued for download');
                        msgBox.showAsync();
                        return;
                    }


                    var msgBox = new Windows.UI.Popups.MessageDialog('Queued for download');
                    MED.Downloads.add({
                        id: id,
                        preview: preview,
                        type: 'media'
                    });
                    msgBox.showAsync();

                } else {
                    WinJS.Navigation.navigate('/pages/fragments/libraries.html', {
                        id: item.el.querySelector('.b_library-tpl__id').name,
                        title: item.title
                    });
                    
                }
            });
            WinJS.Binding.processAll(element, this.data);
            WinJS.UI.processAll(element);
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
        getItem: function (element) {
            var result = false;
            while (element) {
                if (element.className === 'b_library-tpl--item') {
                    var name = element.querySelector('.b_library-tpl--item__path span').textContent;
                    result = { type: 'folder', el: element, title: name };
                    break;
                }
                if (element.className === 'b_media-tpl--item') {
                    var name = element.querySelector('.b_media-tpl--item__title span').textContent;
                    result = { type: 'media', el: element, title: name };
                    break;
                }
                element = element.parentNode;
            }
            return result;
         }
    });
})();


