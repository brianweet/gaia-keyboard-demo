/// <reference path="lib.dom.d.ts" />

class EmulateTouchEvents{
	private heightOffset;
	private keyboardContainer;

	constructor() {
	}

	start(touchEventList: IRecordedTouchEvent[]){
		var length = touchEventList.length;
		for (var i = 0; i < length; ++i) {
			this.scheduleEvent(touchEventList[i]);
		}
	}

	scheduleEvent(recordedEvent: IRecordedTouchEvent){
		window.setTimeout(this.fireEvent, recordedEvent.time, recordedEvent);
	}

	fireEvent(recordedEvent: IRecordedTouchEvent){
  		var el = document.elementFromPoint(recordedEvent.screenX, recordedEvent.screenY);
     	var event = new CustomEvent(recordedEvent.type, {
          cancelable: true,
          bubbles: true
        });
        event.changedTouches = [
          {
            target: el,
            identifier: 0,
            clientX: recordedEvent.screenX,
            clientY: recordedEvent.screenY
          }
        ];
        el.dispatchEvent(event);
	}
}


interface IRecordedTouchEvent {
    type: string;
    screenX: number;
    screenY: number;
    keycode: number;
    keycodeUpper: number;
    isUpperCase: boolean;
    time: number;
    systemTime: number;
}