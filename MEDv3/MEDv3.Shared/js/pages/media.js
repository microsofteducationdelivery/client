(function () {

    'use strict';
    var colors = ['#000', '#00f', '#0f0', '#ff0', '#f00', '#fff'];
    var sizes = [5, 10, 15, 20, 25];

    var pageCtr = WinJS.UI.Pages.define('/pages/media.html', {
        init: function (element, option) {
            this._pallet = {
                color: colors[0],
                size: sizes[0],
                brush: false,
                eraser: false
            };

            this._element = element;
        },
        isEditble: function () {
            return this._pallet.brush || this._pallet.eraser;
        },
        ready: function (element, options) {
            this.data = WinJS.Binding.as({
                subtype: options.subtype,
                color: this._pallet.color
            });
            this.frameEditor = new MED.Service.FrameEditor.Editor() ;
            this.id = options.id;
            MED.Server.addStat(this.id, 1);
            this.element = element;
            var playBtn = WinJS.Utilities.query('.play_btn', element);
            var colorBtns = WinJS.Utilities.query('.colorList li', element);
            var sizeBtns = WinJS.Utilities.query('.sizeList li', element);
            var brashBtn = WinJS.Utilities.query('.brush', element);
            var eraseBtn = WinJS.Utilities.query('.eraser', element);
            var video = WinJS.Utilities.query('.b-media__video', element)[0];
            this.options = options;
            var me = this;
            var comment = WinJS.Utilities.query('.b_media--comments--box__input', me._element)[0];
            function startEdit() {
                video.width = video.clientWidth;
                video.height = video.clientHeight;
                if (!me.isEditble()) {
                    sizeBtns.removeClass('active');
                    colorBtns.removeClass('active');
                    playBtn.removeClass('hidden');
                    me.frameEditor.edit(video, me._pallet.color, me._pallet.size);
                    var colorIndex = colors.indexOf(me._pallet.color);
                    var sizeIndex = sizes.indexOf(me._pallet.size);
                    sizeBtns[sizeIndex].classList.add('active');
                    colorBtns[colorIndex].classList.add('active');

                }
                video.pause();

            };
            playBtn.listen('click', function () {
                video.play();
                this.frameEditor.cancel();
                this._pallet = {
                    color: colors[0],
                    size: sizes[0],
                    brush: false,
                    eraser: false
                };
                sizeBtns.removeClass('active');
                colorBtns.removeClass('active');
                brashBtn.removeClass('active');
                eraseBtn.removeClass('active');

                playBtn.addClass('hidden');
            }.bind(this));
            colorBtns.listen('click', function (e) {
                colorBtns.removeClass('active');
                var color = e.target.color;
                var colorIndex = colors.indexOf(color);
                colorBtns[colorIndex].classList.add('active');
                this._pallet.color = color;
                this.data.color = this._pallet.color;
                me.frameEditor.setColor(color);
            }.bind(this));

            sizeBtns.listen('click', function (e) {
                sizeBtns.removeClass('active');
                var size = e.target.size;
                var sizeIndex = sizes.indexOf(size);
                sizeBtns[sizeIndex].classList.add('active');
                this._pallet.size = size;
                me.frameEditor.setSize(size);

            }.bind(this));

            brashBtn.listen('click', function (e) {
                startEdit();
                me.frameEditor.setMode(0);
                this._pallet.eraser = false;
                this._pallet.brush = true;//!this._pallet.brush;
                this._pallet.brush ? brashBtn.addClass('active') : brashBtn.removeClass('active');
                eraseBtn.removeClass('active');
            }.bind(this));

            eraseBtn.listen('click', function () {
                startEdit();
                me.frameEditor.setMode(1);
                this._pallet.eraser = true;//!this._pallet.eraser;
                this._pallet.brush = false;
                this._pallet.eraser ? eraseBtn.addClass('active') : eraseBtn.removeClass('active');
                brashBtn.removeClass('active');
            }.bind(this));

            WinJS.Utilities.query('.save', element).listen('click', function (e) {
                me.frameEditor.save(detail.title);
            });

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
                var sendBtn = WinJS.Utilities.query('.b_media--comments--box__send-btn')[0];
                sendBtn.disabled = true;
                if (!commentText.length) {
                    sendBtn.disabled = false;
                    me.setPopupHidden(true);
                    return;
                }
                MED.Downloads.sendComment(me.id, commentText).done(function () {
                    me.setPopupHidden(true);
                    sendBtn.disabled = false;
                    me.getComments();
                    comment.value = '';
                });
            });
            
            this.getComments();
            WinJS.Binding.processAll(element, this.data);

        },
        unload: function () {
            this.frameEditor.cancel();
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

            Windows.Storage.ApplicationData.current.localFolder.getFileAsync(MED.LocalStorage.getPrefix() + this.id + "." + extension).then(function (file) {
                var url = URL.createObjectURL(file);
                switch (extension) {
                    case 'mp4':
                        video.src = url;
                     //   video.play();
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
            MED.Downloads.loadComments(this.id).then(function (res) {
                if (res.status !== 200) {
                    return false;
                } else {
                    document.querySelector('.b_media--comments--footer').classList.remove('hidden');

                    var comments = JSON.parse(res.response);
                    var commentContainer = me.element.querySelector('.b_media--comments--area').winControl.data = new WinJS.Binding.List(comments);
                }
                
            }, function (err) {
                return err;
            });
        },
        setTitle: function (title) {
            return this._element.querySelector('.b_media--media__title').innerHTML = title;
        },
        setDescription: function (desc) {
            return this._element.querySelector('.b_media--media__description').innerHTML = desc;
        }
    });
    var Color = WinJS.Class.define(function (params) {
        this.color = params;
    });
    var Size = WinJS.Class.define(function (params) {
        this.size = params;
        this.style =  params + 'px';
    });

    WinJS.Namespace.define("MED.Pages.ViewHelpers.Media", {
        colors: new WinJS.Binding.List(colors.map(function (color) { return new Color(color); })),
        sizes: new WinJS.Binding.List(sizes.map(function (size) { return new Size(size); })),
        getBackgroundUrl: WinJS.Binding.converter(function (color) {
            var url = '/images/Icons_Med-25-08-0';
            var colorIndex = colors.indexOf(color) + 3;
            return url + colorIndex + '.png';
        }),
        isVideo: WinJS.Binding.converter(function (extension) {
            return extension === 'mp4' ? 'inline-block' : 'none';
        }),
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


