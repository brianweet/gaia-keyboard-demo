/* global TypeTestScoreHandler, Utils */
/* exported TypeTestHandler */

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

TypeTestHandler.prototype.LOADING_PANEL_ELEMENT_ID = 'loading-panel';
TypeTestHandler.prototype.CONTENT_PANEL_ELEMENT_ID = 'content-panel';

TypeTestHandler.prototype.ONGOING_GAME_PANEL_ELEMENT_ID = 'ongoing-game-panel';
TypeTestHandler.prototype.SENTENCE_ELEMENT_ID = 'sentence';
TypeTestHandler.prototype.STATUS_ELEMENT_ID = 'type-test-status';


TypeTestHandler.prototype.start = function(keyboardDimensions, screenDimensions) {
  if(this._starting || this._started){
    return;
  } 

  this._starting = true;
  this.loadingPanel = document.getElementById(this.LOADING_PANEL_ELEMENT_ID);
  this.contentPanel = document.getElementById(this.CONTENT_PANEL_ELEMENT_ID);
  this.ongoingGamePanel = document.getElementById(this.ONGOING_GAME_PANEL_ELEMENT_ID);
  this.sentenceEl = document.getElementById(this.SENTENCE_ELEMENT_ID);
  this.statusSpan = document.getElementById(this.STATUS_ELEMENT_ID);
  

  Promise
    .all([this._register(keyboardDimensions, screenDimensions), this._getDataSet()])
    .then(function() {
      //init first sentence
      if(!dataset || !dataset.length){
        throw new Error('TypeTestHandler: No dataset');  
      }

      //start score handler
      this.scoreHandler = new TypeTestScoreHandler(this, dataset.length, 10);
      this.scoreHandler.start();

      this._setNewSentence();

      this.loadingPanel.hidden = true;
      this.contentPanel.hidden = false;

      this._started = true;
      this._starting = false;
    }.bind(this), function(e) {
      //TODO: do something with the error?
      this.statusSpan.innerHTML = 'Loading failed.. ' + e;
      this._starting = false;

      throw new Error('TypeTestHandler: registration failed : ' + e);
    }.bind(this));
  };

TypeTestHandler.prototype.stop = function() {
  if(this.scoreHandler)
    this.scoreHandler.stop();

};

TypeTestHandler.prototype.processLog = function(logMessage) {
  var logData = logMessage.logData;
  var currentResultObject = results.get(logMessage.data.id);
  if(!currentResultObject || !logData || !logData.length)
    return;

  //log and save data
  currentResultObject.typedSequence = this.app.inputMethodHandler._currentText;
  currentResultObject.data = logData;

  this._sendResultToServer(currentResultObject)
    .then(function success(response) {
        currentResultObject.uploaded = true;
    },function error(e) {
        //try again? 
    });

  //calculate score
  this.scoreHandler.addCompletedSentence(currentResultObject);
  this.scoreHandler.showScore();

  //fetch new sentence
  setTimeout(function(){
    if(!dataset.length){
      this.timeIsUp();
    } else{
      this._setNewSentence();
    }
  }.bind(this), 1000);
}

TypeTestHandler.prototype.checkInputChar = function(char){
    if(!this._started)
      return;

    var result = results.get(this.currentResultId);
    if(!result)
      throw new Error('TypeTest: Can\'t find current sentence.');

    var sentence = result.sentence.s;
    if(sentence.length <= this.currentCharPos)
      return;

    //User just started typing
    if(this.currentCharPos === 0){
      this.scoreHandler.startTyping(sentence.length);
    }

    //check if input char is correct
    var isWrongChar = false;
    if(sentence[this.currentCharPos].toLowerCase() !== char.toLowerCase()){
      isWrongChar = true;
      result.wrongCharCount++;
    }

    //check if we have to end the current sentence
    if(sentence.length <= ++this.currentCharPos){
      this._endCurrentSentence();
    }
    
    //show progress on UI (make part of the sentence bold)
    this._drawUISentence(this.sentenceEl, this.currentCharPos, isWrongChar, sentence);
};

TypeTestHandler.prototype.timeIsUp = function() {
  this._started = false;

  this.app.postMessage({
    api: 'touchTrack',
    method: 'stopTracking'
  });

  this.app.removeFocus();
  this.ongoingGamePanel.hidden = true;
  this.scoreHandler.showScore();
  this.scoreHandler.showDonePanel();
};

TypeTestHandler.prototype._register = function(resizeArgs, screenDimensions) {
  //TODO validate data

  //send data to server
  return Utils.postJSON('/api/register/', { resizeArgs : resizeArgs, screenDimensions: screenDimensions, userAgent: navigator.userAgent })
  .then(function(resp){
      //TODO: check response
      this._typeTestSessionId = resp;

    }.bind(this));
};

TypeTestHandler.prototype._getDataSet = function() {
  return Utils.getJSON('/dataset/mem1.json')
  .then(function(resp){
      dataset = JSON.parse(resp);
    }.bind(this));
}

TypeTestHandler.prototype._sendResultToServer = function(resultSentenceObj) {
  //TODO validate data

  //send data to server
  return Utils.postJSON('/api/sentence/' + this._typeTestSessionId, resultSentenceObj);
};

TypeTestHandler.prototype._setNewSentence = function() {

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

  //ensure that we're tracking touches
  this.app.postMessage({
    api: 'touchTrack',
    method: 'startTracking'
  });

  //get new sentence from dataset
  var newSentenceObj = dataset.splice(Math.floor(Math.random()*dataset.length),1)[0];
  
  //create result object to store results in
  var sentenceResult = new SentenceResult(newSentenceObj);
  results.set(sentenceResult.id, sentenceResult);
  this.currentResultId = sentenceResult.id;
  this.currentCharPos = 0;
  var currentChar = newSentenceObj.s.slice(0,1);

  while(this.sentenceEl.lastChild)
    this.sentenceEl.removeChild(this.sentenceEl.lastChild);

  var newEl = document.createElement('strong');
  newEl.appendChild(document.createTextNode(currentChar));
  this.sentenceEl.appendChild(newEl);
  this.sentenceEl.appendChild(document.createTextNode(newSentenceObj.s.slice(1)));

  //
  this.scoreHandler.updateLevel();
};

TypeTestHandler.prototype._endCurrentSentence = function() {
  this.scoreHandler.stopTyping();

  if(window.navigator.vibrate)
    window.navigator.vibrate(400);
  
  //get key logs and prepare for next sentence?
  this.app.postMessage({
    api: 'touchTrack',
    method: 'getLogAndClear',
    id: this.currentResultId
  });
};

TypeTestHandler.prototype._drawUISentence = function(el, cp, iwc, s) {
  window.requestAnimationFrame(
    function(el, charPos, isWrongChar, sentence) {
      var lastChar = s.slice(charPos-1, charPos),
          newChar = s.slice(charPos, charPos + 1),
          remainingText = s.slice(charPos + 1);
      
      //remove remaining text
      if(el.lastChild && el.lastChild.nodeName === '#text'){
        el.removeChild(el.lastChild);
      }

      //remove last strong character (want to add it as mark element)
      if(el.lastChild && el.lastChild.nodeName.toLocaleLowerCase() === 'strong'){
        el.removeChild(el.lastChild);
      }

      if(!el.lastChild)
        el.appendChild(document.createTextNode(lastChar));
      else{
        el.lastChild.textContent += lastChar;
      }

      //if next char is space, show underscore
      if(remainingText.length && /\s/.test(newChar))
        newChar = '_';
      var newCharEl = document.createElement('strong');
      newCharEl.appendChild(document.createTextNode(newChar));
      el.appendChild(newCharEl);
      el.appendChild(document.createTextNode(remainingText));
      
    }.bind(this, el, cp, iwc, s));
};

exports.TypeTestHandler = TypeTestHandler;

}(window));