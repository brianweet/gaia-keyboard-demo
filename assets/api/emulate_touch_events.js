/// <reference path="lib.dom.d.ts" />
var EmulateTouchEvents = (function () {
    function EmulateTouchEvents(touchEventList) {
        if (!touchEventList) {
            this.touchEventList = [
                { "sId": "645lgtf9", "type": "touchstart", "x": 248, "y": 449, "evtTargetChar": ".", "coordChar": ".", "kc": "46", "kcu": "46", "isUpper": false, "t": 0, "st": 1424342837824 },
                { "sId": "645lgtf9", "type": "touchend", "x": 248, "y": 449, "evtTargetChar": ".", "coordChar": ".", "kc": "46", "kcu": "46", "isUpper": false, "t": 68, "st": 1424342837892 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 189, "y": 369, "evtTargetChar": "h", "coordChar": "h", "kc": "104", "kcu": "72", "isUpper": true, "t": 2062, "st": 1424342839886 },
                { "sId": "645lgtf9", "type": "touchend", "x": 189, "y": 369, "evtTargetChar": "h", "coordChar": "h", "kc": "104", "kcu": "72", "isUpper": true, "t": 2144, "st": 1424342839968 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 269, "y": 314, "evtTargetChar": "o", "coordChar": "o", "kc": "111", "kcu": "79", "isUpper": false, "t": 2318, "st": 1424342840142 },
                { "sId": "645lgtf9", "type": "touchend", "x": 269, "y": 314, "evtTargetChar": "o", "coordChar": "o", "kc": "111", "kcu": "79", "isUpper": false, "t": 2420, "st": 1424342840244 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 45, "y": 310, "evtTargetChar": "w", "coordChar": "w", "kc": "119", "kcu": "87", "isUpper": false, "t": 2583, "st": 1424342840407 },
                { "sId": "645lgtf9", "type": "touchend", "x": 45, "y": 310, "evtTargetChar": "w", "coordChar": "w", "kc": "119", "kcu": "87", "isUpper": false, "t": 2661, "st": 1424342840485 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 196, "y": 465, "evtTargetChar": " ", "coordChar": " ", "kc": "32", "kcu": "32", "isUpper": false, "t": 2744, "st": 1424342840568 },
                { "sId": "645lgtf9", "type": "touchend", "x": 196, "y": 465, "evtTargetChar": " ", "coordChar": " ", "kc": "32", "kcu": "32", "isUpper": false, "t": 2806, "st": 1424342840630 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 20, "y": 366, "evtTargetChar": "a", "coordChar": "a", "kc": "97", "kcu": "65", "isUpper": false, "t": 2928, "st": 1424342840752 },
                { "sId": "645lgtf9", "type": "touchend", "x": 20, "y": 366, "evtTargetChar": "a", "coordChar": "a", "kc": "97", "kcu": "65", "isUpper": false, "t": 2996, "st": 1424342840820 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 116, "y": 307, "evtTargetChar": "r", "coordChar": "r", "kc": "114", "kcu": "82", "isUpper": false, "t": 3164, "st": 1424342840988 },
                { "sId": "645lgtf9", "type": "touchend", "x": 116, "y": 307, "evtTargetChar": "r", "coordChar": "r", "kc": "114", "kcu": "82", "isUpper": false, "t": 3221, "st": 1424342841045 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 85, "y": 312, "evtTargetChar": "e", "coordChar": "e", "kc": "101", "kcu": "69", "isUpper": false, "t": 3363, "st": 1424342841187 },
                { "sId": "645lgtf9", "type": "touchend", "x": 85, "y": 312, "evtTargetChar": "e", "coordChar": "e", "kc": "101", "kcu": "69", "isUpper": false, "t": 3405, "st": 1424342841229 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 185, "y": 465, "evtTargetChar": " ", "coordChar": " ", "kc": "32", "kcu": "32", "isUpper": false, "t": 3499, "st": 1424342841323 },
                { "sId": "645lgtf9", "type": "touchend", "x": 185, "y": 465, "evtTargetChar": " ", "coordChar": " ", "kc": "32", "kcu": "32", "isUpper": false, "t": 3577, "st": 1424342841401 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 175, "y": 305, "evtTargetChar": "y", "coordChar": "y", "kc": "121", "kcu": "89", "isUpper": false, "t": 3788, "st": 1424342841612 },
                { "sId": "645lgtf9", "type": "touchend", "x": 175, "y": 305, "evtTargetChar": "y", "coordChar": "y", "kc": "121", "kcu": "89", "isUpper": false, "t": 3834, "st": 1424342841658 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 273, "y": 308, "evtTargetChar": "o", "coordChar": "o", "kc": "111", "kcu": "79", "isUpper": false, "t": 3969, "st": 1424342841793 },
                { "sId": "645lgtf9", "type": "touchend", "x": 273, "y": 308, "evtTargetChar": "o", "coordChar": "o", "kc": "111", "kcu": "79", "isUpper": false, "t": 4007, "st": 1424342841831 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 223, "y": 294, "evtTargetChar": "u", "coordChar": "u", "kc": "117", "kcu": "85", "isUpper": false, "t": 4147, "st": 1424342841971 },
                { "sId": "645lgtf9", "type": "touchmove", "x": 223, "y": 297, "evtTargetChar": "u", "coordChar": "u", "kc": "117", "kcu": "85", "isUpper": false, "t": 4200, "st": 1424342842024 },
                { "sId": "645lgtf9", "type": "touchmove", "x": 219, "y": 299, "evtTargetChar": "u", "coordChar": "u", "kc": "117", "kcu": "85", "isUpper": false, "t": 4247, "st": 1424342842071 },
                { "sId": "645lgtf9", "type": "touchend", "x": 219, "y": 299, "evtTargetChar": "u", "coordChar": "u", "kc": "117", "kcu": "85", "isUpper": false, "t": 4338, "st": 1424342842162 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 4, "y": 453, "evtTargetChar": "\u0012", "coordChar": "\u0012", "kc": "18", "kcu": "18", "isUpper": false, "t": 4417, "st": 1424342842241 },
                { "sId": "645lgtf9", "type": "touchmove", "x": 4, "y": 454, "evtTargetChar": "\u0012", "coordChar": "\u0012", "kc": "18", "kcu": "18", "isUpper": false, "t": 4446, "st": 1424342842270 },
                { "sId": "645lgtf9", "type": "touchend", "x": 4, "y": 454, "evtTargetChar": "\u0012", "coordChar": "\u0012", "kc": "18", "kcu": "18", "isUpper": false, "t": 4528, "st": 1424342842352 },
                { "sId": "645lgtf9", "type": "touchstart", "x": 261, "y": 404, "evtTargetChar": "?", "coordChar": "m", "kc": "63", "kcu": "63", "isUpper": false, "t": 4675, "st": 1424342842499 },
                { "sId": "645lgtf9", "type": "touchend", "x": 261, "y": 404, "evtTargetChar": "?", "coordChar": "m", "kc": "63", "kcu": "63", "isUpper": false, "t": 4684, "st": 1424342842508 }
            ];
        }
        else {
            this.touchEventList = touchEventList;
        }
    }
    EmulateTouchEvents.prototype.start = function () {
        var length = this.touchEventList.length;
        for (var i = 0; i < length; ++i) {
            this.scheduleEvent(this.touchEventList[i]);
        }
    };
    EmulateTouchEvents.prototype.scheduleEvent = function (recordedEvent) {
        window.setTimeout(this.fireEvent, recordedEvent.t, recordedEvent);
    };
    EmulateTouchEvents.prototype.fireEvent = function (recordedEvent) {
        var el = document.elementFromPoint(recordedEvent.x, recordedEvent.y);
        var event = new CustomEvent(recordedEvent.type, {
            cancelable: true,
            bubbles: true
        });
        event.changedTouches = [
            {
                target: el,
                identifier: 0,
                clientX: recordedEvent.x,
                clientY: recordedEvent.y
            }
        ];
        el.dispatchEvent(event);
    };
    return EmulateTouchEvents;
})();
