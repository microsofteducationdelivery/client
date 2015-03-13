(function () {
    "use strict";

    var ControlConstructor = WinJS.UI.Pages.define("/pages/media.html", {
        data: null,

        loadComments: function () {
            var me = this;
            MED.ProgressBar.show();
            var server = localStorage.getItem('currentServer');
            //FIXME:
            return MED.SecureSettings.get('token').then(function (token) {
                return WinJS.xhr({
                    url: server + '/api/mobile/comments/' + me.id + "?dc=" + Math.random(),
                    headers: {
                        'Authorization': 'bearer ' + token
                    },
                    responseType: 'json'
                }).then(function ok(req) {
                    if (req.status !== 200) {
                        WinJS.Utilities.query('.b-comment-send')[0].classList.add('hidden');
                        return
                    }
                    WinJS.Utilities.query('.b-comment-send')[0].classList.remove('hidden');
                    var data = JSON.parse(req.response);
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].reply) {
                            data[i].answer = 'block';
                            data[i].question = 'none';
                        } else {
                            data[i].answer = 'none';
                            data[i].question = 'block';

                        }

                    }
                    me.element.querySelector('.b-comments-container').winControl.data = new WinJS.Binding.List(data);
                    MED.ProgressBar.hide();
                    console.log('ok');

                }, function () {
                    WinJS.Utilities.query('.b-comment-send')[0].classList.add('hidden');
                    MED.ProgressBar.hide();
                });
            });
        },

        toggleVideo: function () {
            var video = this.element.querySelector('video');
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        },

        openDescription: function () {
            WinJS.Navigation.navigate('/pages/description.html', this.options);
        },

        openLinks: function () {
            WinJS.Navigation.navigate('/pages/links.html', this.options);
        },

        sendComment: function () {
            var me = this;
            var comment = document.querySelector('.b-new-comment').value;
            if (!comment.length) {
                return;
            }
            document.querySelector('.b-new-comment').value = '';
            var server = localStorage.getItem('currentServer');
            return MED.SecureSettings.get('token').then(function (token) {
                return WinJS.xhr({
                    url: server + '/api/mobile/comments',
                    type: 'POST',
                    data: JSON.stringify({ id: me.id, text: comment, author: localStorage.getItem('name') }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'bearer ' + token

                    }
                }).done(function () {
                    me.loadComments();
                }, function () {
                    var msgBox = new Windows.UI.Popups.MessageDialog('Sending comment failed');
                    msgBox.showAsync();
                });
            });
        },

        delete: function () {
            var me = this;
            var msg = new Windows.UI.Popups.MessageDialog("Are you sure? Media will be wiped from your device");
            msg.commands.append(new Windows.UI.Popups.UICommand("Delete", function () {
                MED.Downloads.remove(me.options.id);
                WinJS.Navigation.back();
            }));
            msg.commands.append(new Windows.UI.Popups.UICommand("Cancel", function () {}));
            msg.defaultCommandIndex = 0;
            msg.cancelCommandIndex = 1;
            msg.showAsync();
        },

        ready: function (element, options) {
            this._sendComment = this.sendComment.bind(this);
            this._toggleVideo = this.toggleVideo.bind(this);
            this._openDescription = this.openDescription.bind(this);
            this._openLinks = this.openLinks.bind(this);
            this._delete = this.delete.bind(this);

            document.getElementById('appbar').winControl.showOnlyCommands(['btn-help', 'btn-descr', 'btn-links', 'btn-delete']);


            this.id = options.id;
            this.element = element;
            var extension = options.subtype;
            var video = element.querySelector('video');
            var image = element.querySelector('img.b-media-image');
            var text = element.querySelector('.b-media-text');
            this.options = options;
            var me = this;

            options = options || {};
            var currentServerId = MED.LocalStorage.getPrefix();

            Windows.Storage.ApplicationData.current.localFolder.getFileAsync(currentServerId + "-" + this.id + "." + extension).then(function (file) {
                var url = URL.createObjectURL(file);
                switch (extension) {
                    case 'mp4': 
                        video.src = url;
                        video.play();
                        break;
                    case 'png':
                        image.src = url;
                        break;
                    case 'txt':
                        Windows.Storage.FileIO.readTextAsync(file).then(function (txt) {
                            text.innerText = txt;
                        });
                }
            })
            WinJS.Binding.processAll(element, options);
            this.loadComments();

            WinJS.Utilities.query('video', element).listen('click', this._toggleVideo);
            WinJS.Utilities.query('.b-send', element).listen('click', this._sendComment);
            WinJS.Utilities.query('#btn-descr').listen('click', this._openDescription);
            WinJS.Utilities.query('#btn-links').listen('click', this._openLinks);
            WinJS.Utilities.query('#btn-delete').listen('click', this._delete);
        },

        unload: function () {
            WinJS.Utilities.query('.b-send', this.element).removeEventListener('click', this._sendComment);
            WinJS.Utilities.query('video', this.element).removeEventListener('click', this._toggleVideo);
            WinJS.Utilities.query('#btn-descr').removeEventListener('click', this._openDescription);
            WinJS.Utilities.query('#btn-links').removeEventListener('click', this._openLinks);
            WinJS.Utilities.query('#btn-delete').removeEventListener('click', this._delete);
        }
    });

    WinJS.Namespace.define("MED.Pages.ViewHelpers.Media", {
        isVideo: WinJS.Binding.converter(function (extension) {
            return extension === 'mp4' ? 'block' : 'none';
        }),

        isImage: WinJS.Binding.converter(function (extension) {
            return extension === 'png' ? 'block' : 'none';
        }),

        isText: WinJS.Binding.converter(function (extension) {
            return  extension === 'txt' ? 'block' : 'none';
        }),

    });
})();