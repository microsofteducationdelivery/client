(function () {

    'use strict';

    var pageCtr = WinJS.UI.Pages.define('/pages/media.html', {
        init: function (element, option) {
            this._element = element;
        },
        ready: function (element, options) {
            
            this.id = options.id;
            this.element = element;
          
            this.options = options;
            var me = this;
            var comment = WinJS.Utilities.query('.b_media--comments--box__input', me._element)[0];
            WinJS.Utilities.query('.b_popup-wrapper', this._element).listen('click', function (e) {
                if (e.target.className === 'b_popup-wrapper') {
                    me.setPopupHidden(true);
                }
            });
            
            var detail = MED.Downloads.getDetails(this.id);
            this.setTitle(detail.title);
            this.setDescription(detail.description);
            this.setMedia();

            WinJS.Utilities.query('.b_media--comments--footer__btn', element).listen('click', function () {
                me.setPopupHidden(false);
                comment.focus();
            });
            WinJS.Utilities.query('.b_media--comments--box__send-btn', me._element).listen('click', function () {
                var commentText = comment.value;
                MED.Downloads.sendComment(me.id, commentText).done(function () {
                    me.getComments();
                    comment.value = '';
                    me.setPopupHidden(true);
                });
            });
            
            this.getComments();
        },
        setPopupHidden: function (hidden) {
            var popup = WinJS.Utilities.query('.b_popup-wrapper', this._element);
            hidden === true ? popup.addClass('hidden') : popup.removeClass('hidden');
        },
        setMedia: function () {
            var currentServerId = MED.Settings.get('currentServerId');
            var extension = this.options.subtype;
            var video = this.element.querySelector('video');
            var image = this.element.querySelector('img.b-media-image');
            var text = this.element.querySelector('.b-media-text');

            Windows.Storage.ApplicationData.current.localFolder.getFileAsync(currentServerId + "-" + this.id + "." + extension).then(function (file) {
                var url = URL.createObjectURL(file);
                switch (extension) {
                    case 'mp4':
                        video.src = url;
                        video.play();
                        image.classList.add('hidden');
                        break;
                    case 'png':
                        image.src = url;
                        video.classList.add('hidden');
                        break;
                    case 'txt':
                        video.classList.add('hidden');
                        image.classList.add('hidden');
                        Windows.Storage.FileIO.readTextAsync(file).then(function (txt) {
                            text.innerText = txt;
                        });
                }
            });
            return extension;
        },
        getComments: function () {
            var me = this;
            MED.Downloads.loadComments(this.id).done(function (res) {
                if (res.status !== 200) {
                    return false;
                } else {
                    document.querySelector('.b_media--comments--footer').classList.remove('hidden');

                    var comments = JSON.parse(res.response);
                    var commentContainer = me.element.querySelector('.b_media--comments--area').winControl.data = new WinJS.Binding.List(comments);
                }
                
            });
        },
        setTitle: function (title) {
            return this._element.querySelector('.b_media--media__title').innerHTML = title;
        },
        setDescription: function (desc) {
            return this._element.querySelector('.b_media--media__description').innerHTML = desc;
        }
    });

    WinJS.Namespace.define("MED.Pages.ViewHelpers.Media", {
        getMargin: WinJS.Binding.converter(function (reply) {
            return reply === true ? '120px' : '0px';
        }),
        getBorder: WinJS.Binding.converter(function (reply) {
            return reply === true ? '3px solid #1a6465' : '3px solid #6ab01c';
        }),
        getWidth: WinJS.Binding.converter(function (reply) {
            return reply === true ? 'calc(90% - 100px)' : '90%';
        })
    });
})();


