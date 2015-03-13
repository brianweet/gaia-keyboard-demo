/// <reference path="lib.dom.d.ts" />
var EmulateTouchEvents = (function () {
    function EmulateTouchEvents() {
        this._currentTime = 0;
        this._timeoutId = -1;
        this._started = false;
    }
    EmulateTouchEvents.prototype.start = function (touchEventList) {
        if (this._started)
            throw 'EmulateTouchEvents: Already started';
        
        this._started = true;
        this._currentTime = 0;
        if (this._timeoutId != -1) {
            window.clearTimeout(this._timeoutId);
            this._timeoutId = -1;
        }
        this.process(touchEventList);
    };
    EmulateTouchEvents.prototype.stop = function () {
        if (this._timeoutId != -1) {
            window.clearTimeout(this._timeoutId);
            this._timeoutId = -1;
        }
        this._started = false;
    };
    EmulateTouchEvents.prototype.process = function (touchEventList) {
        if (!this._started)
            return;
        var length = touchEventList.length;
        var currentTouches = [];
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
        if (!this._started)
            return;
        this._timeoutId = window.setTimeout(function () {
            this._currentTime = eventTimeStamp;
            //fire touch events
            this.fireEvent(recordedEvents.slice());
            //process rest of the events
            if (remainingEvents && remainingEvents.length)
                this.process(remainingEvents.slice());
        }.bind(this), eventTimeStamp - this._currentTime);
        //console.log(eventTimeStamp - this._currentTime);
        //console.log(eventTimeStamp);
    };
    EmulateTouchEvents.prototype.fireEvent = function (recordedEvents) {
        if (!this._started)
            return;

        var el;
        app.layoutRenderingManager.domObjectMap.forEach(function (target, targetEl) {
            if(recordedEvents[0].keycode == target.keyCode)
                el= targetEl;
        });

        if(!el)
            el = document.elementFromPoint(recordedEvents[0].screenX, recordedEvents[0].screenY);

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
        };
        el.dispatchEvent(event);
        //console.log(event);
        //console.log(recordedEvents[0].type + ' ' + String.fromCharCode(recordedEvents[0].keycode) + ' ' +  recordedEvents[0].screenX + ' ' + recordedEvents[0].screenY)
    };
    return EmulateTouchEvents;
})();
