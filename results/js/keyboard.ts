///<reference path="lib.dom.d.ts" />
///<reference path="models.ts" />
"use strict";

class TouchEventRenderer {
    private context: CanvasRenderingContext2D;
    private sentenceResults: ISentenceResult[] = [];
    private renderedCharCode: number;
    public keyboard: Keyboard;

    constructor(ctx: CanvasRenderingContext2D, keyboard: Keyboard, results : ISentenceResult[]){
        this.context = ctx;
        this.keyboard = keyboard;

        for (var i = 0; i < results.length; i++) {
            this.sentenceResults.push(results[i]);
        }
    }

    renderSentence(res: ISentenceResult, context: CanvasRenderingContext2D, charCode?: number){
        var currentCharIdx = 0;
        var j = 0;
        for (var i = 0; i < res.sentence.s.length; i++) {
            var correctChar = res.sentence.s[i];
            var correctCharCode = correctChar.charCodeAt(0);
            var typedChar = res.typedSequence[i];
            var typedCharCode = typedChar.charCodeAt(0);

            //find the touch end event index for this charcode
            var touchEndIndex = this.findEventIdx(res.data, j, typedChar, true);
            
            if(typeof touchEndIndex == "undefined")
                touchEndIndex = this.findEventIdx(res.data, j, typedChar);

            if(typeof touchEndIndex == "undefined"){
                console.error('couldn\'t find touch event?!' + typedChar);
                continue;
            }

            //if we don't want to draw, continue with next iteration
            if(charCode && (correctChar.toLowerCase().charCodeAt(0) != charCode && correctChar.toUpperCase().charCodeAt(0) != charCode)){
                j = touchEndIndex +1;
                continue;
            }

            //draw red/green dots
            var e = res.data[touchEndIndex];
            if(correctChar.toLowerCase().charCodeAt(0) === typedCharCode || correctChar.toUpperCase().charCodeAt(0) === typedCharCode)
                context.fillStyle = '#0F0';
            else
                context.fillStyle = '#F00';

            context.fillRect(e.screenX, e.screenY, 2, 2);
            j = touchEndIndex +1;

        }
    }

    render(charCode?: number){
        this.keyboard.render();
        for (var i = 0; i < this.sentenceResults.length; ++i) {
            this.renderSentence(this.sentenceResults[i], this.context, charCode);
        }
        this.renderedCharCode = charCode;
    }

    private findEventIdx(data : IRecordedTouchEvent[], startIndex: number, findChar: string, fromCoords: boolean = false): number{
        for (var i =  startIndex; i < data.length; i++) {
            var e = data[i];

            //for now, only focus on touch end events
            if(e.type != TouchEventType.touchend)
                continue;
            
            var eventCharCode;
            if(fromCoords){
                eventCharCode = 
                (/^[a-zA-Z\s]$/.test(findChar)) ?
                //seems like e.keycode and e.keycodeUpper are not reliable...
                this.keyboard.charCodeFromCoordinates(e.screenX, e.screenY) :
                e.keycode;
            } else {
                eventCharCode = e.keycode;
            }
            
            var eventChar = String.fromCharCode(eventCharCode);

            if(findChar == eventChar || findChar == eventChar.toUpperCase()){
                return i;
            }
        };
    }
}

class Keyboard {
    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private heightOffset:  number;
    private keys: IKey[];
    

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number, heightOffset: number, keys: IKey[]) {
        this.context = ctx;
        this.width = width;
        this.height = height;
        this.heightOffset = heightOffset;
        this.keys = keys;
    }

    charCodeFromCoordinates(x: number, y: number): number{
        var key: IKey;
        for (var i = 0; i < this.keys.length; ++i) {
            key = this.keys[i];
            var dim = this._getKeyDimensions(key);

            if((dim.x <= x && dim.x + dim.width > x) &&
                (dim.y <= y && dim.y + dim.height > y)){
                return key.code;
            }
        }
        return;
    }

    render() {
        //draw keyboard outline
        this.context.strokeRect(0, this.heightOffset, this.width ,this.height); 
        
        //draw key outlines
        var key: IKey;
        for (var i = 0; i < this.keys.length; i++) {
            var dim = this._getKeyDimensions(this.keys[i]);

            //var k = this.keys[i];
            //var cssMargin = k.height/4.3*0.4;
            this.context.strokeRect(dim.x, dim.y, dim.width, dim.height);    
        };
    }

    private _getKeyDimensions(key: IKey){
        var cssMargin = key.height/4.3*0.4;

        var keyX = key.x, 
            keyWidth = key.width,
            keyHeight = key.height + 2 * cssMargin,
            keyY = key.y - cssMargin + this.heightOffset;

        if(key.code === 97 || key.code === 65){
            keyX = 0;
            keyWidth = key.width * 1.5;
        }

        if(key.code === 108 || key.code === 76){
            keyWidth = key.width * 1.5;
        }

        return {
            x: keyX,
            y: keyY,
            width: keyWidth,
            height: keyHeight
        };
    }
}

class Export {
    static touchEvents(results: ISentenceResult[], keys: IKey[], heightOffset: number){
        var eventArray = [];
        for (var i = 0; i < results.length; i++) {
            var sen = results[i];
            for (var j = 0; j < sen.data.length; j++) {
                var te = sen.data[j];
                var coordCharCode = Keyboard.prototype.charCodeFromCoordinates.call({keys:keys, heightOffset: heightOffset}, te.screenX, te.screenY);
                eventArray.push({
                    sId: sen.id,
                    type: te.type,
                    x: te.screenX,
                    y: te.screenY,
                    evtTargetChar: String.fromCharCode(te.keycode),
                    coordChar: (coordCharCode) ? String.fromCharCode(coordCharCode) : '',
                    kc: te.keycode,
                    kcu: te.keycodeUpper,
                    isUpper: te.isUpperCase,
                    t: te.time,
                    st: te.systemTime
                });
            };
        };

        return eventArray;
    }

    static sentences(results: ISentenceResult[]){
        var sentencesArray = [];
        for (var i = 0; i < results.length; i++) {
            var sen = results[i];
            sentencesArray.push({
                id: sen.id,
                sId: sen.sentence.id,
                sSen: sen.sentence.s,
                typedSequence: sen.typedSequence,
                wrongCharCount: sen.wrongCharCount
                });
        };
        return sentencesArray;
    }

    static toCsv(data: Array<{}>){
        var str = '';
        for (var i = 0; i < data.length; ++i) {
            var obj = data[i];
            for (var prop in obj) {
                if(obj.hasOwnProperty(prop)){
                    //doesn't escape " chars
                    str += '"' + obj[prop].toString() + '",';
                }
            }
            str = str.substring(0, str.length-1) + '\n';
        }
        return str;
    }
}

















