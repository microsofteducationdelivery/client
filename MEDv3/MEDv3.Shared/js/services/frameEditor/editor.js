'use strict';

var requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

/**
 * @param {CanvasRenderingContext2D} context
 * @param {String} lineWidth
 * @param {String} color
 */
function Brush(context, lineWidth, color) {
    if (!(context instanceof CanvasRenderingContext2D)) {
        throw new Error('No 2D rendering context given!');
    }

    this.ctx = context;
    this.strokes = [];
    this.lastLength = 0;
    this.isTouching = false;

    // init context
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = this.ctx.lineJoin = 'round';

}

Brush.prototype.setStyle = function (color, lineWidth, compositeOperation) {
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.globalCompositeOperation = compositeOperation;

};

Brush.prototype.getEvtXY = function (event) {
    var x = event.offsetX, y = event.offsetY;

    if (event['touches']) {
        var rect = this.ctx.canvas.getBoundingClientRect();
        x = event['touches'][0].clientX - rect.left;
        y = event['touches'][0].clientY - rect.top;
    }

    return { x: x, y: y };
};

/**
 * Begins a new stroke
 * @param  {MouseEvent} event
 */
Brush.prototype.start = function (event) {
    this.workingStrokes = [this.getEvtXY(event)];
    this.strokes.push(this.workingStrokes);
    this.lastLength = 1;
    this.isTouching = true;
    requestAnimationFrame(this._draw.bind(this));
};

/**
 * Moves the current position of our brush
 * @param  {MouseEvent} event
 */
Brush.prototype.move = function (event) {
    if (!this.isTouching) { return; }

    this.workingStrokes.push(this.getEvtXY(event));
    requestAnimationFrame(this._draw.bind(this));
};

/**
 * Stops a stroke
 * @param  {MouseEvent} event
 */
Brush.prototype.end = function (event) {
    this.isTouching = false;
};

Brush.prototype._draw = function () {

    // save the current length quickly (it's dynamic)
    var length = this.workingStrokes.length;

    // return if there's no work to do
    if (length <= this.lastLength) {
        return;
    }

    var startIndex = this.lastLength - 1;

    this.lastLength = length;

    var pt0 = this.workingStrokes[startIndex];

    this.ctx.beginPath();

    this.ctx.moveTo(pt0.x, pt0.y);

    for (var j = startIndex; j < this.lastLength; j++) {

        var pt = this.workingStrokes[j];

        this.ctx.lineTo(pt.x, pt.y);

    }

    this.ctx.stroke();

};

function Editor() {}

Editor.modes = {
    brush: 0,
    eraser: 1
};
Editor.getSizeOfVideo = function (tagWidth, tagHeight, vWidth, vHeight) {
    var coef,
        sizes = {};

    coef = tagHeight / vHeight;

    var realWidth = coef * vWidth;
    var realHeigth = tagHeight;

    if (realWidth > tagWidth) {

        coef = tagWidth / vWidth;
        realHeigth = coef * vHeight;
        realWidth = tagWidth;
    }

    sizes.width = realWidth;
    sizes.height = realHeigth;
    sizes.top = (tagHeight - realHeigth) / 2;
    sizes.left = (tagWidth - realWidth) / 2;

    return sizes;
};

Editor.prototype = {
    constructor: Editor,
    edit: function (video, color, size) {
        this.$back = document.body.appendChild(document.createElement('canvas'));
        this.$back.style.position = 'absolute';
        this.$front = document.body.appendChild(document.createElement('canvas'));
        this.$front.style.position = 'absolute';

        this.color = color;
        this.size = size;
        var sizes = Editor.getSizeOfVideo(
            video.width,
            video.height,
            video.videoWidth,
            video.videoHeight
        );
        
        this.$back.style.top = video.getClientRects()[0].top + sizes.top + 'px';
        this.$back.style.left = video.offsetLeft + sizes.left + 'px';
        this.$front.style.top = video.getClientRects()[0].top + sizes.top +  'px';
        this.$front.style.left = video.offsetLeft + sizes.left + 'px';

        var bw = sizes.width;
        var bh = sizes.height;
        this.video = video;
        this.$back.width = bw;
        this.$back.height = bh;
        this.$back.getContext('2d').drawImage(video, 0, 0, bw, bh);

        this.$front.width = bw;
        this.$front.height  = bh;
        this.ctx = this.$front.getContext('2d');
        this.ctx.clearRect(0, 0, bw, bh);

        this.bindEvents();
        this.brush = new Brush(this.ctx, this.size, this.color);
        this.mode = Editor.modes.brush;
    },
    getColor: function () {
        return this.color;
    },
    setColor: function (color) {
        this.color = color;
    },
    setSize: function (size) {
        this.size = size;
    },
    getSize: function () {
        return this.size;
    },
    getMode: function () {
        return this.mode;
    },
    setMode: function (mode) {
        this.mode = mode;
    },
    bindEvents: function () {
        var start = function (evt) {
            evt.preventDefault();
            evt.stopImmediatePropagation();

            if (evt.which === 3) {
                return;
            }
            var compositeOperation = this.mode === Editor.modes.brush ? 'source-over' : 'destination-out';
            this.brush.setStyle(this.color, this.size, compositeOperation);
            this.brush.start(evt);
        }.bind(this);
        this.$front.addEventListener('MSPointerDown', start);
        this.$front.addEventListener('pointerdown', start);
        this.$front.addEventListener('touchstart', start);
        this.$front.addEventListener('mousedown', start);

        var move = function (evt) {
            evt.preventDefault();
            evt.stopImmediatePropagation();
            this.brush.move(evt);
        }.bind(this);
        this.$front.addEventListener('MSPointerMove', move);
        this.$front.addEventListener('pointermove', move);
        this.$front.addEventListener('touchmove', move);
        this.$front.addEventListener('mousemove', move);

        var stop = function (evt) {
            evt.preventDefault();
            evt.stopImmediatePropagation();
            this.brush.end(evt);
        }.bind(this);
        this.$front.addEventListener('MSPointerUp', stop);
        this.$front.addEventListener('pointerup', stop);
        this.$front.addEventListener('touchend', stop);
        this.$front.addEventListener('mouseup', stop);
    },
    save: function (name) {
        if (!this.$back) {
            return;
        }

        var img = this.$back.getContext('2d');
        img.drawImage(this.$front, 0, 0, this.$front.width, this.$front.height);
        var me = this;
        var savePicker = new Windows.Storage.Pickers.FileSavePicker();

        savePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
        // Dropdown of file types the user can save the file as
        savePicker.fileTypeChoices.insert("Image", [".png"]);
        // Default file name if the user does not type one in or select a file to replace
        savePicker.suggestedFileName = name || 'image';

        savePicker.pickSaveFileAsync().
            then(function (file) {
                if (!file) {
                    return;
                }

                return file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (stream) {
                    if (!stream) {
                        return false;
                    }

                    var output = stream.getOutputStreamAt(0);
                    var blob = me.$back.msToBlob();
                    var input = blob.msDetachStream();

                    return Windows.Storage.Streams.RandomAccessStream.copyAsync(input, output).then(function () {
                        return {
                            input: input,
                            output: output,
                            stream: stream
                        }
                    });
                }).then(function (imgStreams) {
                    return imgStreams.output.flushAsync().then(function () {
                        return imgStreams;
                    });
                }).then(function (imgStreams) {
                    imgStreams.input.close();
                    imgStreams.output.close();
                    imgStreams.stream.close();
                });
            }).done(function (imgStreams) {
                img.drawImage(me.video, 0, 0, me.$back.width, me.$back.height);
            });
    },
    cancel: function () {
        if (!this.$back) {
            return;
        }
        document.body.removeChild(this.$back);
        document.body.removeChild(this.$front);
    }
};
WinJS.Namespace.define("MED.Service.FrameEditor", {
    Editor: Editor
});