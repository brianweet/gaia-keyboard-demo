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