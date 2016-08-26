(function () {
    'use strict';

    function onGestureChange(e) {
        var coords = {
            x: e.clientX,
            y: e.clientY
        };
        this.lastCoords = coords;
        if (!this.coords) {
            this.coords = coords;
        }
    };

    function onPointerDown(e) {
        if (e.currentTarget.gesture.pointerType === null) {                    // First contact 
            e.currentTarget.gesture.addPointer(e.pointerId);                   // Attaches pointer to element (e.target is the element) 
            e.currentTarget.gesture.pointerType = e.pointerType;
        }
        else if (e.currentTarget.gesture.pointerType === e.pointerType) {      // Contacts of similar type 
            e.currentTarget.gesture.addPointer(e.pointerId);                   // Attaches pointer to element (e.target is the element) 
        }

    }

    function onGestureEnd(e) {
        if (this.isLeftSlide()) {
            WinJS.Application.queueEvent({
                type: "med.back_slide",
                event: e
            });
        }
        e.currentTarget.gesture.pointerType = null;
        this.coords = null;
    }

    WinJS.Namespace.define("MED.Mixins", {
        Slideable: {
            slideWidthLimit: 650,
            slideHeigthLimit: 20,
            coords: null,
            lastCoords: null,
            gestureObject: new MSGesture(),
            isLeftSlide: function () {
                if (!this.coords) {
                    return false
                }
                var xSubstraction = this.lastCoords.x - this.coords.x;
                var ySubstraction = this.lastCoords.y - this.coords.y;

                if (xSubstraction > this.slideWidthLimit && ySubstraction <= this.slideHeigthLimit) {
                    return true;
                }
                return false;
                
            },
            initSlider: function (el) {
                var gestureObject = this.gestureObject;
                gestureObject.target = el;
                gestureObject.srcElt = el;
                el.gesture = gestureObject;
                el.gesture.pointerType = null;

                el.addEventListener("pointerdown", onPointerDown.bind(this), false);
                el.addEventListener("MSGestureChange", onGestureChange.bind(this), false);
                el.addEventListener("MSGestureEnd", onGestureEnd.bind(this), false);
            }
        }
    });

})();

