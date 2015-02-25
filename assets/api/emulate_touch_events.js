/// <reference path="lib.dom.d.ts" />
var EmulateTouchEvents = (function () {
    function EmulateTouchEvents() {
        this._currentTime = 0;
        this._timeoutId = -1;
    }
    EmulateTouchEvents.prototype.start = function (touchEventList) {
        this._currentTime = 0;
        if (this._timeoutId != -1) {
            window.clearTimeout(this._timeoutId);
            this._timeoutId = -1;
        }
        this.process(touchEventList);
    };
    EmulateTouchEvents.prototype.process = function (touchEventList) {
        var length = touchEventList.length;
        var currentTouches = [];
        debugger;
        var i = 0;
        var currentEv = touchEventList[i];
        currentTouches.push(currentEv);
        while (++i < touchEventList.length && touchEventList[i].time === currentEv.time) {
            currentTouches.push(touchEventList[i]);
        }
        //schedule events and remove current touches from the list
        this.scheduleEvents(currentTouches, currentEv.time, touchEventList.slice(i));
    };
    EmulateTouchEvents.prototype.scheduleEvents = function (recordedEvents, eventTimeStamp, remainingEvents) {
        this._timeoutId = window.setTimeout(function () {
            this._currentTime = eventTimeStamp;
            //fire touch events
            this.fireEvent(recordedEvents);
            //process rest of the events
            if (remainingEvents && remainingEvents.length)
                this.process(remainingEvents);
        }.bind(this), eventTimeStamp - this._currentTime);
    };
    EmulateTouchEvents.prototype.fireEvent = function (recordedEvents) {
        var el = document.elementFromPoint(recordedEvents[0].screenX, recordedEvents[0].screenY);
        var event = new CustomEvent(recordedEvents[0].type, {
            cancelable: true,
            bubbles: true
        });
        event.changedTouches = [];
        for (var i = 0; i < recordedEvents.length; ++i) {
            var recordedEvent = recordedEvents[i];
            event.changedTouches.push({
                target: el,
                identifier: recordedEvent.identifier || 0,
                radiusX: recordedEvent.radiusX || 0,
                radiusY: recordedEvent.radiusY || 0,
                clientX: recordedEvent.screenX,
                clientY: recordedEvent.screenY
            });
        }
        ;
        el.dispatchEvent(event);
    };
    return EmulateTouchEvents;
})();
