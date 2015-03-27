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
            else
                this.endInput();
        }.bind(this), eventTimeStamp - this._currentTime);
    };
    EmulateTouchEvents.prototype.fireEvent = function (recordedEvents) {
        if (!this._started)
            return;
        var el;
        app.layoutRenderingManager.domObjectMap.forEach(function (target, targetEl) {
            if (recordedEvents[0].keycode == target.keyCode)
                el = targetEl;
        });
        if (!el)
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
                identifier: recordedEvent.touchId || 0,
                radiusX: recordedEvent.radiusX || 0,
                radiusY: recordedEvent.radiusY || 0,
                clientX: recordedEvent.screenX,
                clientY: recordedEvent.screenY
            });
        }
        ;
        el.dispatchEvent(event);
    };
    EmulateTouchEvents.prototype.endInput = function () {
        if (!this._started)
            return;
        var el, touch, evt;
        app.layoutRenderingManager.domObjectMap.forEach(function (target, targetEl) {
            if (target.keyCode == KeyEvent.DOM_VK_RETURN)
                el = targetEl;
        });
        touch = {
            target: el,
            identifier: 0,
            radiusX: 0,
            radiusY: 0,
            clientX: el.offsetLeft + el.clientWidth - 1,
            clientY: window.innerHeight - el.offsetHeight + el.clientHeight - 1
        };
        setTimeout(function () {
            evt = new CustomEvent('touchstart', {
                cancelable: true,
                bubbles: true
            });
            evt.changedTouches = [];
            evt.changedTouches.push(touch);
            el.dispatchEvent(evt);
        }, 350);
        setTimeout(function () {
            evt = new CustomEvent('touchend', {
                cancelable: true,
                bubbles: true
            });
            evt.changedTouches = [];
            evt.changedTouches.push(touch);
            el.dispatchEvent(evt);
        }, 400);
        setTimeout(function () {
            window.parent.postMessage({
                api: 'demo',
                method: 'finishedTyping'
            }, '*');
        }, 500);
    };
    return EmulateTouchEvents;
})();
