var TouchEventType = (function () {
    // boilerplate 
    function TouchEventType(value) {
        this.value = value;
    }
    TouchEventType.prototype.toString = function () {
        return this.value;
    };
    // values 
    TouchEventType.touchstart = new TouchEventType("touchstart");
    TouchEventType.touchmove = new TouchEventType("touchmove");
    TouchEventType.touchend = new TouchEventType("touchend");
    return TouchEventType;
})();
