class Point {
    constructor(public x,public y){}
}
class TouchEventType
{
    // boilerplate 
    constructor(public value:string){    
    }

    toString(){
        return this.value;
    }

    // values 
    static touchstart = new TouchEventType("touchstart");
    static touchmove = new TouchEventType("touchmove");
    static touchend = new TouchEventType("touchend");
}

interface ISentenceResult {
    id: string;
    sentence: ISentence;
    typedSequence: string;
    wrongCharCount: number;
    data: IRecordedTouchEvent[];
}
interface ISentence {
    id: string;
    s: string;
}

interface IAnnotatedTouchEvent extends IRecordedTouchEvent{
    isCorrect: boolean;
    correctCharCode: number;
    distanceToCorrectKey: number;
}

interface IRecordedTouchEvent {
    type: TouchEventType;
    screenX: number;
    screenY: number;
    keycode: number;
    keycodeUpper: number;
    isUpperCase: boolean;
    time: number;
    systemTime: number;
}

interface IKey {
    code: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

class KbKey implements IKey{
    public code: number;
    public x: number;
    public y: number;
    public height: number;
    public width: number;

    constructor(public heightOffset: number, key: IKey){
        this.code = key.code;
        var dim = this._calculateKeyDimensions(key);
        this.x = dim.x;
        this.y = dim.y;
        this.width = dim.width;
        this.height = dim.height;
    }

    private _calculateKeyDimensions(key: IKey){
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

interface IKeyDimensions {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface IHighscore {
    PartitionKey: string;
    RowKey: string;
    Timestamp: string;
    nickname: string;
    correctChars: number;
    chars: number;
    wrongChars: number;
    error: number;
    charPerMinute: number;
    totalTime: number;
}