///<reference path="lib.dom.d.ts" />
///<reference path="models.ts" />
///<reference path="bivargauss.ts" />
"use strict";

class AnnotationHelper {
    static getAnnotatedEvents(keyboard: Keyboard, sentenceResult: ISentenceResult){
        var currentCharIdx = 0;
        var j = 0;
        var annotatedTouchEvents: IAnnotatedTouchEvent[] = [];

        for (var i = 0; i < sentenceResult.sentence.s.length; i++) {
            var correctChar = sentenceResult.sentence.s[i];
            var correctCharCode = correctChar.charCodeAt(0);
            var typedChar = sentenceResult.typedSequence[i];
            if(!typedChar)
                break;
            var typedCharCode = typedChar.charCodeAt(0);

            //find the touch end event index for this charcode
            var touchEndIndex = this.findEventIdx(keyboard, sentenceResult.data, j, typedChar);
            
            if(typeof touchEndIndex == "undefined"){
                console.error('couldn\'t find touch event?!' + typedChar);
                continue;
            }
            //draw red/green dots
            var e = sentenceResult.data[touchEndIndex];
            var isCorrect = correctChar.toLowerCase().charCodeAt(0) === typedCharCode || 
                            correctChar.toUpperCase().charCodeAt(0) === typedCharCode;
            
            var key = keyboard.keyFromCharCode(correctChar.toLowerCase().charCodeAt(0));
            var distance = 9999;
            if(key)
                distance = keyboard.distanceForKey(key, e.screenX, e.screenY);

            annotatedTouchEvents.push({
                isCorrect: isCorrect,
                distanceToCorrectKey: distance,
                correctCharCode: correctCharCode, 
                type: e.type,
                screenX: e.screenX,
                screenY: e.screenY,
                keycode: e.keycode,
                keycodeUpper: e.keycodeUpper,
                isUpperCase: e.isUpperCase,
                time: e.time,
                systemTime: e.systemTime
                });
            
            j = touchEndIndex +1;
        }
        return annotatedTouchEvents;
    }

    static findEventIdx(keyboard: Keyboard, data : IRecordedTouchEvent[], startIndex: number, findChar: string): number{
        for (var i =  startIndex; i < data.length; i++) {
            var e = data[i];

            //for now, only focus on touch end events
            if(e.type != TouchEventType.touchend)
                continue;
            
            var isNormalChar = /^[a-zA-Z\s]$/.test(findChar);
            var eventTargetCorrect = findChar === String.fromCharCode(e.keycode) || findChar === String.fromCharCode(e.keycodeUpper);
            var eventCharCode;
            if(!isNormalChar){
                eventCharCode = e.keycode;
            } else if(eventTargetCorrect){
                eventCharCode = e.keycode;
            } else{
                eventCharCode = keyboard.charCodeFromCoordinates(e.screenX, e.screenY);
            }
            var eventChar = String.fromCharCode(eventCharCode);

            if(findChar == eventChar || findChar == eventChar.toUpperCase()){
                return i;
            }
        };
    } 
}

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

    setSentenceResults(results: ISentenceResult[]){
        this.sentenceResults.length = 0;
        for (var i = 0; i < results.length; i++) {
            this.sentenceResults.push(results[i]);
        }
    }

    renderSentence(res: ISentenceResult, context: CanvasRenderingContext2D, onlyDrawCharCode?: number){
        var annotatedTouchEvents = AnnotationHelper.getAnnotatedEvents(this.keyboard, res);
        for (var i = 0; i < annotatedTouchEvents.length; ++i) {
            var annotatedEv = annotatedTouchEvents[i];

            //if we don't want to draw, continue with next iteration
            if(onlyDrawCharCode && (annotatedEv.correctCharCode != onlyDrawCharCode && annotatedEv.correctCharCode != onlyDrawCharCode))
                continue;
            
            if(annotatedEv.isCorrect)
                context.fillStyle = '#0F0';
            else
                context.fillStyle = '#F00';
            // if(onlyDrawCharCode)
            //     console.log(annotatedEv.screenX, annotatedEv.screenY);
            context.fillRect(annotatedEv.screenX, annotatedEv.screenY, 2, 2);
        }
    }

    render(charCode?: number){
        this.keyboard.render();
        for (var i = 0; i < this.sentenceResults.length; ++i) {
            this.renderSentence(this.sentenceResults[i], this.context, charCode);
        }
        this.renderedCharCode = charCode;
    }

    private findEventIdx(data : IRecordedTouchEvent[], startIndex: number, findChar: string): number{
        for (var i =  startIndex; i < data.length; i++) {
            var e = data[i];

            //for now, only focus on touch end events
            if(e.type != TouchEventType.touchend)
                continue;
            
            var isNormalChar = /^[a-zA-Z\s]$/.test(findChar);
            var eventTargetCorrect = findChar === String.fromCharCode(e.keycode) || findChar === String.fromCharCode(e.keycodeUpper);
            var eventCharCode;
            if(!isNormalChar){
                eventCharCode = e.keycode;
            } else if(eventTargetCorrect){
                eventCharCode = e.keycode;
            } else{
                eventCharCode = this.keyboard.charCodeFromCoordinates(e.screenX, e.screenY);
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
    private keys: KbKey[] = [];
    
    constructor(ctx: CanvasRenderingContext2D, width: number, height: number, heightOffset: number, keys: IKey[]) {
        this.context = ctx;
        this.width = width;
        this.height = height;
        this.heightOffset = heightOffset;
        for (var i = 0; i < keys.length; ++i) {
            this.keys.push(new KbKey(heightOffset, keys[i]));
        }
    }

    charCodeFromCoordinates(x: number, y: number): number{
        var key: KbKey;
        for (var i = 0; i < this.keys.length; ++i) {
            key = this.keys[i];

            if((key.x <= x && key.x + key.width > x) &&
                (key.y <= y && key.y + key.height > y)){
                return key.code;
            }
        }
        return;
    }

    keyFromCharCode(charCode: number) {
        var key: KbKey;
        for (var i = 0; i < this.keys.length; ++i) {
            key = this.keys[i];
            if(key.code == charCode)
            return key;
        }
        return;
    }

    distanceForKey(key1: KbKey, x: number, y: number) {
        var cx1 = key1.x + key1.width / 2;
        var cy1 = key1.y + key1.height / 2;
        var sqx = (cx1 - x)*(cx1 - x);
        var sqy = (cy1 - y)*(cy1 - y);
        return Math.sqrt(sqx+sqy);
    }

    render() {
        //draw keyboard outline
        this.context.strokeRect(0, this.heightOffset, this.width ,this.height); 
        
        //draw key outlines
        var key: KbKey;
        for (var i = 0; i < this.keys.length; i++) {
            key = this.keys[i];
            this.context.strokeRect(key.x, key.y, key.width, key.height);    
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

class ModelGenerator {
    private _minModelEvents = 50;
    private randomKeyEvents = {};
    constructor(public events: IAnnotatedTouchEvent[], public keys: KbKey[]){
        // Generate random events woah
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var cx = key.x + key.width / 2;
            var cy = key.y + key.height / 2;

            for (var j = 0; j < this._minModelEvents; ++j) {
                if(j === 0)
                    this.randomKeyEvents[key.code] = [];

                this.randomKeyEvents[key.code].push({ screenX: this.rnd() * key.width/2 + cx , screenY: this.rnd() * key.height/2 + cy  });
            }
        }

        this.events = this.events.sort((a: IAnnotatedTouchEvent,b: IAnnotatedTouchEvent) => {
            if(a.correctCharCode < b.correctCharCode)
                return -1;
            else if(a.correctCharCode > b.correctCharCode)
                return 1;
            else 
                return 0;
        });
    }

    private rnd(){
        // Look for better normal distributed random generator
        return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
    }

    calculate(){
        var result = [];
        var forChars = 'abcdefghijklmnopqrstuvwxyz., '.split('');
        for (var i = 0; i < forChars.length; i++) {
            var currentChar = forChars[i];
            var charCode = currentChar.charCodeAt(0);
            var charEvents = this.events.filter((ev) => { 
                return ev.distanceToCorrectKey < 40 && (+ev.correctCharCode === +charCode || +ev.correctCharCode === +charCode) 
                });

            // add random events to end up with a total of 100 events
            var allEvents = (charEvents.length < this._minModelEvents) ? 
                                charEvents.concat(this.randomKeyEvents[charCode].slice(0, 100 - charEvents.length)) : 
                                charEvents.slice(0, 100);

            var points = allEvents.map((ev) => { return new Point(ev.screenX, ev.screenY) });
           
            var distr = BivariateGaussHelper.getDistributionStatistics(points);
            if(distr)
                result.push({char: currentChar, stat: distr});
        }
        // console.log(result);

        // //mu = [0, 0];
        // //sigma = [.5 0; 0 .5];
        // var mu = result.map((r)=>{ return '[' + r.stat.meanX + ', ' + r.stat.meanY + ']' });
        // var sigma = result.map((r)=>{ return '[' + r.stat.varianceX + ', ' + r.stat.covariance + ';' +
        //                                         r.stat.covariance + ',' + r.stat.varianceY + ']' });
        // console.log('[' + mu.join(';') + ']');
        // console.log('[' + sigma.join(';') + ']');
        
        return result;
    }
}















