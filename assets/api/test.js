var EmulateTouchEvents = (function () {
    function EmulateTouchEvents(touchEventList) {
        var touchEvent = touchEventList[0];
        var e = document.createEvent('TouchEvent');
    }
    return EmulateTouchEvents;
})();
