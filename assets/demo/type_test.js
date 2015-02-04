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
TypeTestHandler.prototype.FINISHED_SENTENCE_ELEMENT_ID = 'type-test-finished-sentence-part';
TypeTestHandler.prototype.REMAINING_SENTENCE_ELEMENT_ID = 'type-test-remaining-sentence-part';

TypeTestHandler.prototype.start = function(keyboardDimensions, screenDimensions) {
  if(this._starting || this._started){
    return;
  }

  this._starting = true;
  this.remainingSentencePartSpan = document.getElementById(this.REMAINING_SENTENCE_ELEMENT_ID);
  this.finishedSentencePartSpan = document.getElementById(this.FINISHED_SENTENCE_ELEMENT_ID);
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

    this._setNewSentence();

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
  this.finishedSentencePartSpan.innerHTML = '';
  this.remainingSentencePartSpan.innerHTML = newSentenceObj.s;
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

    //User started typing
    if(this.currentCharPos === 0){
      this.scoreHandler.hideScore();
      this.scoreHandler.startProgressBar(sentence.length);
    }

    //check if input char is correct
    var isWrongChar = false;
    if(sentence[this.currentCharPos] !== char){
      isWrongChar = true;
      result.wrongCharCount++;

      console.log('Wrong char');
      if(window.navigator.vibrate)
        window.navigator.vibrate(50);
    }

    //check if we have to end the current sentence
    if(sentence.length <= ++this.currentCharPos){
      this._endCurrentSentence();
    }
    
    //show progress on UI (make part of the sentence bold)
    window.requestAnimationFrame(function() {
      var remainingText = sentence.slice(this.currentCharPos),
          currentChar = sentence.slice(this.currentCharPos-1, this.currentCharPos),
          finishedEl = this.finishedSentencePartSpan,
          remainingEl = this.remainingSentencePartSpan;

      //first remove remaining sentence
      if(remainingEl.lastChild)
        remainingEl.removeChild(remainingEl.lastChild);

      //want to show wrong spaces as underscores
      if(isWrongChar && /\s/.test(currentChar))
        currentChar = '_';

      //if next char is space, show underscore
      if(remainingText.length && /\s/.test(remainingText.slice(0,1)))
        remainingText = remainingText.replace(' ','_');

      //add remaining sentence to span
      remainingEl.appendChild(document.createTextNode(remainingText));
      debugger;
      var lastStrongEl;
      if(!finishedEl.lastChild || finishedEl.lastChild.tagName.toLowerCase() !== 'strong'){
        lastStrongEl = document.createElement('strong');
        lastStrongEl.classList.add(isWrongChar ? "text-danger" : "text-success");
        finishedEl.appendChild(lastStrongEl);
      } else {
        lastStrongEl = finishedEl.lastChild;
      }

      if(lastStrongEl.classList.contains(isWrongChar ? "text-danger" : "text-success")){
        lastStrongEl.appendChild(document.createTextNode(currentChar));
      } else {
        var newStrongEl = document.createElement('strong');
        newStrongEl.classList.add(isWrongChar ? "text-danger" : "text-success");
        newStrongEl.appendChild(document.createTextNode(currentChar));
        finishedEl.appendChild(newStrongEl)
      }
    }.bind(this));

    return;
};

exports.TypeTestHandler = TypeTestHandler;

}(window));