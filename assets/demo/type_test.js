'use strict';

(function(exports) {

var SentenceResult = (function () {
    function SentenceResult(sentenceObject) {
        this.id = Math.random().toString(32).substr(2, 8);
        this.sentence = sentenceObject;
        this.typedSequence = '';
        this.wrongCharCount = 0;
        this.data = [];
        this.done = false;
        this.uploaded = false;
    }
    return SentenceResult;
})();

var results = new Map(),
    dataset = [];

var TypeTestHandler = function(app) {
  this.app = app;
  this._typeTestSessionId = null;
  this._started = this._starting = false;
  this.currentResultId = null;
  this.currentCharPos = 0;
};

TypeTestHandler.prototype.CONTENT_PANEL_ELEMENT_ID = 'content-panel';
TypeTestHandler.prototype.LOADING_PANEL_ELEMENT_ID = 'loading-panel';
TypeTestHandler.prototype.STATUS_ELEMENT_ID = 'type-test-status';
TypeTestHandler.prototype.CURRENT_SENTENCE_ELEMENT_ID = 'type-test-current-sentence';

TypeTestHandler.prototype.start = function(keyboardDimensions, screenDimensions) {
  if(this._starting || this._started){
    return;
  }

  this._starting = true;
  this.currentSentenceSpan = document.getElementById(this.CURRENT_SENTENCE_ELEMENT_ID);
  this.statusSpan = document.getElementById(this.STATUS_ELEMENT_ID);
  this.contentPanel = document.getElementById(this.CONTENT_PANEL_ELEMENT_ID);
  this.loadingPanel = document.getElementById(this.LOADING_PANEL_ELEMENT_ID);
  this.scoreHandler = new TypeTestScoreHandler(this.app);
  this.scoreHandler.start();

  Promise.all([this.register(keyboardDimensions, screenDimensions), this.getDataSet()])
  .then(function() {
    //tell touchtrack to start tracking keys
    this.app.postMessage({
      api: 'touchTrack',
      method: 'startTracking'
    });
    
    //init first sentence
    if(!dataset || !dataset.length){
      throw new Error('TypeTestHandler: No dataset');  
    }

    this._setNewSentence(dataset[0]);

    this.loadingPanel.style.display = 'none';
    this.contentPanel.style.display = '';

    this._started = true;
    this._starting = false;
  }.bind(this), function(e) {
    //TODO: do something with the error?
    this.statusSpan.innerHTML = e;
    this._starting = false;

    return new Error('TypeTestHandler: registration failed' + e);
  }.bind(this));
};

function getJSON(url){
  return doXHR('get', url);
}

function doPOST(url, dataObject){
  return doXHR('post', url, dataObject);
}
  
function doXHR(method, url, dataObject){
  return new Promise(function(resolve, reject) {
    var jsonString;
    var xhr = new window.XMLHttpRequest({mozSystem: true});
    xhr.open(method, url, true);

    if(dataObject){
      jsonString = JSON.stringify(dataObject);
      xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    }
    
    xhr.addEventListener('load', transferDone, false);
    xhr.addEventListener('error', transferDone, false);
    xhr.addEventListener('abort', transferDone, false);

    function transferDone(ev) {
      if(xhr.status === 200){
          resolve(xhr.response);
      } else {
          reject(xhr.response);
      }
    }

    try {
        xhr.send(jsonString);
      } catch (e) {
        reject(e);
        return;
      }
  }.bind(this));
}

TypeTestHandler.prototype.register = function(resizeArgs, screenDimensions) {
  //TODO validate data

  //send data to server
  return doPOST('/api/register/', { resizeArgs : resizeArgs, screenDimensions: screenDimensions })
  .then(function(resp){
      //TODO: check response
      this._typeTestSessionId = resp;
    }.bind(this));
};

TypeTestHandler.prototype.getDataSet = function() {
  return getJSON('/dataset/mem1.json')
  .then(function(resp){
      dataset = JSON.parse(resp);
    }.bind(this));
}

TypeTestHandler.prototype.sendResultToServer = function(resultSentenceObj) {
  //TODO validate data

  //send data to server
  return doPOST('/api/sentence/' + this._typeTestSessionId, resultSentenceObj);
};

TypeTestHandler.prototype.processLog = function(logMessage) {
  var logData = logMessage.logData;
  var currentResultObject = results.get(logMessage.data.id);
  if(!currentResultObject || !logData || !logData.length)
    return;

  //log and save data
  currentResultObject.typedSequence = this.app.inputMethodHandler._currentText;
  currentResultObject.data = logData;
  console.log(currentResultObject);
  this.sendResultToServer(currentResultObject)
    .then(function success(response) {
        currentResultObject.uploaded = true;
    },function error(e) {
        //try again? 
    });

  //calculate score
  this.scoreHandler.showScore(currentResultObject);

  //fetch new sentence
  setTimeout(function(){
    if(!dataset.length)
      this.statusSpan.innerHTML = "You are done woohooo!";
    else
      this._setNewSentence();
  }.bind(this), 200);
}

TypeTestHandler.prototype._setNewSentence = function() {
  //get new sentence from dataset
  var newSentenceObj = dataset.splice(Math.floor(Math.random()*dataset.length),1)[0];
  
  //reset keyboard to initial state
  this.app.inputMethodHandler.clear();
  this.app.postMessage({
    api: 'inputmethod',
    method: 'setInputContext',
    ctx: true,
    selectionStart: 0,
    selectionEnd: 0,
    textBeforeCursor: '',
    textAfterCursor: ''
  });

  //create result object to store results in
  var sentenceResult = new SentenceResult(newSentenceObj);
  results.set(sentenceResult.id, sentenceResult);
  this.currentResultId = sentenceResult.id;
  this.currentSentenceSpan.innerHTML = newSentenceObj.s;
  this.currentCharPos = 0;
};

TypeTestHandler.prototype._endCurrentSentence = function() {
  console.log('TypeTestHandler: End current sentence');

  if(window.navigator.vibrate)
    window.navigator.vibrate(400);
  
  //get key logs and prepare for next sentence?
  this.app.postMessage({
    api: 'touchTrack',
    method: 'getLogAndClear',
    id: this.currentResultId
  });

  this.scoreHandler.stopProgressBar();
};

TypeTestHandler.prototype.checkInputChar = function(char){
    if(!this._started)
      return;

    var result = results.get(this.currentResultId);
    if(!result)
      throw new Error('TypeTest: Can\'t find current sentence.');

    var sentence = result.sentence.s;
    if(sentence.length <= this.currentCharPos)
      return;

    if(this.currentCharPos === 0){
      this.scoreHandler.hideScore();
      this.scoreHandler.startProgressBar(sentence.length);
    }

    //check if input char is correct
    if(sentence[this.currentCharPos] !== char){
      console.log('Wrong char');

      result.wrongCharCount++;
      if(window.navigator.vibrate)
        window.navigator.vibrate(50);
      return;
    }

    //check if we have to end the current sentence
    if(sentence.length <= ++this.currentCharPos){
      this._endCurrentSentence();
    }
    
    //show progress on UI (make part of the sentence bold)
    window.requestAnimationFrame(function() {
      var spanEl = this.currentSentenceSpan;
      //remove current text
      while(spanEl.lastChild){
        spanEl.removeChild(spanEl.lastChild);
      }

      //add new text with already typed part as strong
      var strEl = document.createElement('strong');
      strEl.appendChild(document.createTextNode(sentence.slice(0, this.currentCharPos)))
      spanEl.appendChild(strEl);
      spanEl.appendChild(document.createTextNode(sentence.slice(this.currentCharPos)));
    }.bind(this));

    return;
};

exports.TypeTestHandler = TypeTestHandler;

}(window));