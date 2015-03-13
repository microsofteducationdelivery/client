(function () {

    'use strict';

    WinJS.UI.Pages.define('/pages/view/library.html', {
        ready: function (element, options) {
            var me = this;
            var isHold = false;
            var libraryTemplate = document.getElementById('lib-tpl').winControl;
            var mediaTemplate = document.getElementById('media-tpl').winControl;
            var listview = element.querySelector('#libraries-list', element).winControl;
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
                if (item.type === 'media') {
                    id = item.el.querySelector('.b_media-tpl__id').name;
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
                    id = item.el.querySelector('.b_library-tpl__id').name;

                    if (list[0] === 'b_library-tpl--item__star') {
                        favorite = list[1];
                        MED.Server.setFavorite(id, favorite === 'unfavorite');
                        favorite === 'unfavorite' ? e.target.className = 'b_library-tpl--item__star favorite' : e.target.className = 'b_library-tpl--item__star unfavorite';
                    } else {
                        WinJS.Navigation.navigate('/pages/fragments/libraries.html', {
                            id: item.el.querySelector('.b_library-tpl__id').name
                        });
                    }
                }
            });
            
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
                    result = { type: 'folder', el: element };
                    break;
                }
                if (element.className === 'b_media-tpl--item') {
                    result = { type: 'media', el: element };
                    break;
                }
                element = element.parentNode;
            }
            return result;
         }
    });
})();


