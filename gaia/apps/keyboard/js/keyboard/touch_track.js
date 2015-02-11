'use strict';

(function(exports) {

  var trackedTouches, startTime;

  var TouchTrack = function(app) {
    this._started = false;
    this._isTracking = false;
    this.app = app;
    trackedTouches = new Array;
    
    this.clear = function(){
      trackedTouches.length = 0;
      startTime = 0;
    }

    this.getTrackedTouches = function(){
      return trackedTouches.slice();
    }
  };

  TouchTrack.prototype.start = function(){
    if (this._started) {
      throw new Error('TouchTrack: ' +
        'Instance should not be start()\'ed twice.');
    }

    this._container = this.app.getContainer();

    this._container.addEventListener('touchstart', this);
    this._container.addEventListener('touchmove', this);
    this._container.addEventListener('touchend', this);
    this._container.addEventListener('touchcancel', this);
    if ('ontouchstart' in window === false){
      this._container.addEventListener('mousedown', this);
      this._container.addEventListener('mouseup', this);
    }
    

    window.addEventListener('message', this);

    this._started = true;
  }

  TouchTrack.prototype.stop = function(){
    if (!this._started) {
      throw new Error('TouchTrack: ' +
        'Instance was never start()\'ed but stop() is called.');
    }
    this._started = false;

    this._container.removeEventListener('touchstart', this);
    this._container.removeEventListener('touchmove', this);
    this._container.removeEventListener('touchend', this);
    this._container.removeEventListener('touchcancel', this);
    if ('ontouchstart' in window === false){
      this._container.removeEventListener('mousedown', this);
      this._container.removeEventListener('mouseup', this); 
    }

    window.removeEventListener('message', this);
  }

  TouchTrack.prototype.handleEvent = function(evt) {
    switch (evt.type) {
      case 'message':

        var data = evt.data;
        if (!data || !data.api || data.api !== 'touchTrack')
          break;

        switch(data.method){
          case 'startTracking':
            this._isTracking = true;
            break;
          case 'stopTracking':
            this._isTracking = false;
            break;
          case 'getLogAndClear':
            evt.source.postMessage({
              api: data.api,
              logData: trackedTouches,
              data: { id: data.id } 
            }, evt.origin);
            this.clear();
            break;
        }
        break;
      case 'touchstart':
      case 'touchmove':
      case 'touchend':
      case 'touchcancel':
      case 'mousedown':
      case 'mousemove':
      case 'mouseup':
        if(!this._isTracking)
          return;

        var eventTime = Date.now();
        //check if we are going to start tracking
        if(trackedTouches.length === 0){
          //don't want to start tracking if user switches layouts
          if(evt.target.classList.contains('special-key'))
            return;

          startTime = eventTime;
        }
        var time = eventTime - startTime;

        if(evt instanceof MouseEvent){
          this.add(evt, evt.type, time);
        }else{
          for (var i = 0; i < evt.changedTouches.length; i++) {
            this.add(evt.changedTouches[i], evt.type, time);
          }
        }
        break;
    }
  };

  TouchTrack.prototype.add = function(evt, type, time) {
    var touchEvent = 
            {
              type: type,
              screenX: evt.screenX,
              screenY: evt.screenY,
              keycode: evt.target.dataset.keycode,
              keycodeUpper: evt.target.dataset.keycodeUpper,
              isUpperCase: this.app.upperCaseStateManager.isUpperCase,
              time: time,
              systemTime: Date.now()
            };
    trackedTouches.push(touchEvent);
  };



  exports.TouchTrack = TouchTrack;
})(window);