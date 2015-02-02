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
    dataset = [
  { id : "x",  s : "Are" },
  { id : "mobile20",  s : "Are you going to join us for lunch?" },
  { id : "mobile89",  s : "Is she done yet?" },
  { id : "mobile95",  s : "Thanks for the quick turnaround." },
  { id : "mobile101", s : "How are you?" },
  { id : "mobile130", s : "Yes, I am playing." },
  { id : "mobile139", s : "Please call tomorrow if possible." },
  { id : "mobile140", s : "We are all fragile." },
  { id : "mobile148", s : "I would like to attend if so." },
  { id : "mobile155", s : "I can return earlier." },
  { id : "mobile156", s : "I am trying again." },
  { id : "mobile174", s : "I will bring John Brindle." },
  { id : "mobile193", s : "He would love anything about rocks." },
  { id : "mobile198", s : "What do you hear?" },
  { id : "mobile212", s : "Hope your trip to Florida was good." },
  { id : "mobile226", s : "What's his problem?" },
  { id : "mobile228", s : "She called and wants to come over this AM." },
  { id : "mobile229", s : "There is now a meeting at 8PM as well." },
  { id : "mobile232", s : "See you soon!" },
  { id : "mobile281", s : "It reads like she is in." },
  { id : "mobile291", s : "Has Dynegy made a specific request?" },
  { id : "mobile292", s : "I am walking in now." },
  { id : "mobile294", s : "They have capacity now." },
  { id : "mobile310", s : "A gift isn't necessary." },
  { id : "mobile313", s : "Tell her to get my expense report done." },
  { id : "mobile314", s : "I am out of town on business tonight." },
  { id : "mobile319", s : "I'm waiting until she comes home." },
  { id : "mobile320", s : "Not even close." },
  { id : "mobile329", s : "Chris Foster is in!" },
  { id : "mobile334", s : "They are more efficiently pooled." },
  { id : "mobile404", s : "Could you try ringing her?" },
  { id : "mobile409", s : "Do you need it today?" },
  { id : "mobile429", s : "Keep me posted!" },
  { id : "mobile434", s : "John this message concerns me." },
  { id : "mobile464", s : "Call me to give me a heads up." },
  { id : "mobile467", s : "And leave my school alone." },
  { id : "mobile479", s : "What is in the plan?" },
  { id : "mobile539", s : "Where do you want to meet to walk over there?" },
  { id : "mobile561", s : "I am almost speechless." },
  { id : "mobile563", s : "Ava, please put me on the list." },
  { id : "mobile564", s : "Suggest you get facts before judging anyone." }
];

var TypeTestHandler = function(app) {
  this.app = app;
  this._typeTestSessionId = null;
  this._started = this._starting = false;
  this.currentResultId = null;
  this.currentCharPos = 0;
};

TypeTestHandler.prototype.STATUS_ELEMENT_ID = 'type-test-status';
TypeTestHandler.prototype.CURRENT_SENTENCE_ELEMENT_ID = 'type-test-current-sentence';

TypeTestHandler.prototype.start = function(keyboardDimensions, screenDimensions) {
  this._starting = true;
  this.currentSentenceSpan = document.getElementById(this.CURRENT_SENTENCE_ELEMENT_ID);
  this.statusSpan = document.getElementById(this.STATUS_ELEMENT_ID);
  this.scoreHandler = new TypeTestScoreHandler(this.app);
  this.scoreHandler.start();

  this.register(keyboardDimensions, screenDimensions)
    .then(function(resp){
      //TODO: check response

      this._typeTestSessionId = resp;

      //tell touchtrack to start tracking keys
      this.app.postMessage({
        api: 'touchTrack',
        method: 'startTracking'
      });

      //init first sentence
      if(dataset && dataset.length){
        this._setNewSentence(dataset[0]);
      }

      this._started = true;
    }.bind(this)).catch(function (e) {
      //TODO: do something with the error?
      this.statusSpan.innerHTML = e;
      this._starting = false;
    }.bind(this));
};

function doXHR(url, dataObject){
  return new Promise(function(resolve, reject) {
    var jsonString = JSON.stringify(dataObject);
    var xhr = new window.XMLHttpRequest({mozSystem: true});
    xhr.open('post', url, true);
    xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    xhr.setRequestHeader('Content-length', jsonString.length);
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
  return doXHR('/api/register/', { resizeArgs : resizeArgs, screenDimensions: screenDimensions });
};

TypeTestHandler.prototype.sendResultToServer = function(resultSentenceObj) {
  //TODO validate data

  //send data to server
  return doXHR('/api/sentence/' + this._typeTestSessionId, resultSentenceObj);
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
    var idx = dataset.indexOf(currentResultObject.sentence);
    if(dataset.length <= ++idx)
      this.statusSpan.innerHTML = "You are done woohooo!";
    else
      this._setNewSentence(dataset[idx]);
  }.bind(this), 200);
}

TypeTestHandler.prototype._setNewSentence = function(newSentenceObj) {
  //TODO: create sentence object
  if(typeof newSentenceObj === "string")
    throw new Error('Expect sentence object');

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
    
    //make next char big boned
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