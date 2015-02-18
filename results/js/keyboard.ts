///<reference path="lib.dom.d.ts" />
///<reference path="models.ts" />
"use strict";

class SentenceResult {

    id: string;
    sentence: ISentence;
    typedSequence: string;
    wrongCharCount: number;
    data: IRecordedTouchEvent[];

    private findEventIdx(startIndex: number, charCode: number): number{
        for (var i =  startIndex; i < this.data.length; i++) {
            var e = this.data[i];
            //for now, only focus on touch end events
            if(e.type == TouchEventType.touchend && (charCode == e.keycode || charCode == e.keycodeUpper)){
                return i;
            }
        };
    }
    
    constructor(res: ISentenceResult){
        this.id = res.id;
        this.sentence = res.sentence;
        this.typedSequence = res.typedSequence;
        this.wrongCharCount = res.wrongCharCount;
        this.data = res.data;
    }

    render(context: CanvasRenderingContext2D, charCode?: number){
        var currentCharIdx = 0;
        var j = 0;
        for (var i = 0; i < this.sentence.s.length; i++) {
            var correctChar = this.sentence.s[i];
            var correctCharCode = correctChar.charCodeAt(0);
            var typedCharCode = this.typedSequence.charCodeAt(i);
            var typedChar = this.typedSequence[i];

            //find the touch end event index for this charcode
            j = this.findEventIdx(j, typedCharCode);
            if(typeof j == "undefined"){
                console.error('couldn\'t find touch event?!');
                return;
            }

            //if we don't want to draw, continue with next iteration
            if(charCode && (correctChar.toLowerCase().charCodeAt(0) != charCode && correctChar.toUpperCase().charCodeAt(0) != charCode)){
                j++;
                continue;
            }

            //draw red/green dots
            if(correctCharCode === typedCharCode)
                context.fillStyle = "#00FF00";
            else   
                context.fillStyle = "#FF0000";

            var e = this.data[j];
            context.fillRect(e.screenX, e.screenY, 2, 2);
            j++;
        }
    }
}

class Keyboard {
    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private heightOffset:  number;
    private keys: IKey[];
    private sentenceResults: SentenceResult[] = [];
    private renderedCharCode?: number;

    constructor(ctx : CanvasRenderingContext2D, width : number, height : number, heightOffset : number, keys : IKey[]) {
        this.context = ctx;
        this.width = width;
        this.height = height;
        this.heightOffset = heightOffset;
        this.keys = keys;
    }

    addSentenceResults(results : ISentenceResult[]){
        for (var i = 0; i < results.length; i++) {
            this.addSentenceResult(results[i]);
        }
    }

    private addSentenceResult(sen : ISentenceResult) {
        this.sentenceResults.push(new SentenceResult(sen));
    }

    private renderKeys() {
        //draw keyboard outline
        this.context.rect(0, this.heightOffset, this.width ,this.height); 
        this.context.stroke();
        
        //draw key outlines
        for (var i = 0; i < this.keys.length; i++) {
            var k = this.keys[i];
            this.context.rect(k.x, k.y + this.heightOffset, k.width, k.height);
            this.context.stroke();
        };
    }

    render(charCode?: number){
        this.renderKeys();
        for (var i = 0; i < this.sentenceResults.length; ++i) {
            this.sentenceResults[i].render(this.context, charCode);
        }
        this.renderedCharCode = charCode;
    }

    charCodeFromCoordinates(x: number, y: number): number{
        var key: IKey;
        for (var i = 0; i < this.keys.length; ++i) {
            key = this.keys[i];
            if((key.x < x && key.x + key.width > x) &&
                (key.y + this.heightOffset < y && key.y + this.heightOffset + key.height >= y)){
                return key.code;
            }
        }
        return;
    }
}


















