/// <reference path="lib.dom.d.ts" />
var EmulateTouchEvents = (function () {
    function EmulateTouchEvents() {
    }
    EmulateTouchEvents.prototype.start = function (touchEventList) {
        var length = touchEventList.length;
        for (var i = 0; i < length; ++i) {
            this.scheduleEvent(touchEventList[i]);
        }
    };
    EmulateTouchEvents.prototype.scheduleEvent = function (recordedEvent) {
        window.setTimeout(this.fireEvent, recordedEvent.time, recordedEvent);
    };
    EmulateTouchEvents.prototype.fireEvent = function (recordedEvent) {
        var el = document.elementFromPoint(recordedEvent.screenX, recordedEvent.screenY);
        var event = new CustomEvent(recordedEvent.type, {
            cancelable: true,
            bubbles: true
        });
        event.changedTouches = [
            {
                target: el,
                identifier: 0,
                clientX: recordedEvent.screenX,
                clientY: recordedEvent.screenY
            }
        ];
        el.dispatchEvent(event);
    };
    return EmulateTouchEvents;
})();
