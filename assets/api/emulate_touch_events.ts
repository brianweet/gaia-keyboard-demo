/// <reference path="lib.dom.d.ts" />

class EmulateTouchEvents{
	private heightOffset;
	private keyboardContainer;
  private _currentTime = 0;
  private _timeoutId = -1;

	constructor() {
	}

	start(touchEventList: IRecordedTouchEvent[]){
    this._currentTime = 0;
    if(this._timeoutId != -1){
      window.clearTimeout(this._timeoutId);
      this._timeoutId = -1;
    }
		this.process(touchEventList);
	}

  process(touchEventList: IRecordedTouchEvent[]){
    var length = touchEventList.length;
    var currentTouches = [];
    debugger;
    var i = 0;
    var currentEv: IRecordedTouchEvent = touchEventList[i];
    currentTouches.push(currentEv);

    //if next event on same time, add next touchevent
    while(++i < touchEventList.length && touchEventList[i].time === currentEv.time){
      currentTouches.push(touchEventList[i]);
    }

    //schedule events and remove current touches from the list
    this.scheduleEvents(currentTouches, currentEv.time, touchEventList.slice(i));
  }

	scheduleEvents(recordedEvents: IRecordedTouchEvent[], eventTimeStamp: number, remainingEvents: IRecordedTouchEvent[]){
		this._timeoutId = window.setTimeout(function(){
      this._currentTime = eventTimeStamp;
      //fire touch events
      this.fireEvent(recordedEvents);
      //process rest of the events
      if(remainingEvents && remainingEvents.length)
        this.process(remainingEvents);
      }.bind(this), eventTimeStamp - this._currentTime);
	}

	fireEvent(recordedEvents: IRecordedTouchEvent[]){
		var el = document.elementFromPoint(recordedEvents[0].screenX, recordedEvents[0].screenY);
   	var event = new CustomEvent(recordedEvents[0].type, {
        cancelable: true,
        bubbles: true
      });
    event.changedTouches = [];
    for (var i = 0; i < recordedEvents.length; ++i) {
      var recordedEvent = recordedEvents[i];
      event.changedTouches.push({
          target: el,
          identifier: recordedEvent.identifier || 0,
          radiusX: recordedEvent.radiusX || 0,
          radiusY: recordedEvent.radiusY || 0,
          clientX: recordedEvent.screenX,
          clientY: recordedEvent.screenY
        })
    };
    
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
    identifier?: number;
    radiusX?: number;
    radiusY?: number;
}