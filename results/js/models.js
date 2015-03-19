var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
})();
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
var KbKey = (function () {
    function KbKey(heightOffset, key) {
        this.heightOffset = heightOffset;
        this.code = key.code;
        var dim = this._calculateKeyDimensions(key);
        this.x = dim.x;
        this.y = dim.y;
        this.width = dim.width;
        this.height = dim.height;
    }
    KbKey.prototype._calculateKeyDimensions = function (key) {
        var cssMargin = key.height / 4.3 * 0.4;
        var keyX = key.x, keyWidth = key.width, keyHeight = key.height + 2 * cssMargin, keyY = key.y - cssMargin + this.heightOffset;
        if (key.code === 97 || key.code === 65) {
            keyX = 0;
            keyWidth = key.width * 1.5;
        }
        if (key.code === 108 || key.code === 76) {
            keyWidth = key.width * 1.5;
        }
        return {
            x: keyX,
            y: keyY,
            width: keyWidth,
            height: keyHeight
        };
    };
    return KbKey;
})();
