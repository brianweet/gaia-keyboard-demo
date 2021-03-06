'use strict';

(function(exports) {

var TypeTestScoreHandler = function(typeTestHandler, nrOfSentences, nrOfLevels) {
  if(!nrOfLevels || !nrOfSentences)
    throw new Error('Need nrOfLevels and nrOfSentences');

  if(nrOfSentences % nrOfLevels != 0)
    throw new Error('nrOfSentences should be divisible by nrOfLevels');

  this.typeTestHandler = typeTestHandler;
  this.nrOfSentences = nrOfSentences;
  this.nrOfLevels = nrOfLevels;

  this.sentencesPerLevel = nrOfSentences/nrOfLevels;
  this.currentLevel = function(){
    return Math.floor(this.completedSentencesCount / this.sentencesPerLevel) + 1;
  };

  this.completedSentencesCount = 0;
  this.totalTimeCount = 0;
  this.totalTypedCharCount = 0;
  this.totalSentenceCharCount = 0;
  this.totalEditDistCount = 0;
  this.progressInterval = -1;
};

// panels
TypeTestScoreHandler.prototype.SCORE_PANEL_ELEMENT_ID = 'score-panel';
TypeTestScoreHandler.prototype.DONE_PANEL_ELEMENT_ID = 'done-panel';
TypeTestScoreHandler.prototype.RESET_PANEL_ELEMENT_ID = 'reset-panel';
TypeTestScoreHandler.prototype.HIGHSCORE_PANEL_ELEMENT_ID = 'highscore-panel';
// progress
TypeTestScoreHandler.prototype.PROGRESS_BAR_ELEMENT_ID = 'progress-bar';
TypeTestScoreHandler.prototype.LAST_SENTENCE_ELEMENT_ID = 'last-sentence';
TypeTestScoreHandler.prototype.TYPED_SENTENCE_ELEMENT_ID = 'typed-sentence';
TypeTestScoreHandler.prototype.CURRENT_LEVEL_ELEMENT_ID = 'current-level';
// current sentence score
TypeTestScoreHandler.prototype.LAST_CPM_ELEMENT_ID = 'last-cpm';
TypeTestScoreHandler.prototype.LAST_EDIT_DIST_ELEMENT_ID = 'last-edit-dist';
TypeTestScoreHandler.prototype.LAST_ERROR_ELEMENT_ID = 'last-error';
//total score
TypeTestScoreHandler.prototype.TOTAL_CPM_ELEMENT_ID = 'total-cpm';
TypeTestScoreHandler.prototype.TOTAL_ERROR_ELEMENT_ID = 'total-error';
//
TypeTestScoreHandler.prototype.HIGHSCORE_BUTTON_ELEMENT_ID = 'highscore-button';
// Submit score
TypeTestScoreHandler.prototype.NICKNAME_ELEMENT_ID = 'nickname';
TypeTestScoreHandler.prototype.NICKNAME_INVALID_ELEMENT_ID = 'nickname-invalid';
TypeTestScoreHandler.prototype.SUBMIT_BUTTON_ELEMENT_ID = 'submit-button';
TypeTestScoreHandler.prototype.SUBMIT_STATUS_ELEMENT_ID = 'submit-status';
// settings
TypeTestScoreHandler.prototype.MIN_CPM = 60;
TypeTestScoreHandler.prototype.MAX_CPM = 300;

TypeTestScoreHandler.prototype.start = function() {
  this.scorePanel = document.getElementById(this.SCORE_PANEL_ELEMENT_ID);
  this.donePanel = document.getElementById(this.DONE_PANEL_ELEMENT_ID);
  this.resetPanel = document.getElementById(this.RESET_PANEL_ELEMENT_ID);
  this.currentLevelElement = document.getElementById(this.CURRENT_LEVEL_ELEMENT_ID);
  this.progressBar = document.getElementById(this.PROGRESS_BAR_ELEMENT_ID);
  this.lastSentence = document.getElementById(this.LAST_SENTENCE_ELEMENT_ID);
  this.lastSentence.appendChild(document.createTextNode(''));
  this.typedSentence = document.getElementById(this.TYPED_SENTENCE_ELEMENT_ID);
  this.typedSentence.appendChild(document.createTextNode(''));

  this.lastCpm = document.getElementById(this.LAST_CPM_ELEMENT_ID);
  this.lastEditDist = document.getElementById(this.LAST_EDIT_DIST_ELEMENT_ID);
  this.lastError = document.getElementById(this.LAST_ERROR_ELEMENT_ID);
  this.totalCpm = document.getElementById(this.TOTAL_CPM_ELEMENT_ID);
  this.totalError = document.getElementById(this.TOTAL_ERROR_ELEMENT_ID);

  this.highscorePanel = document.getElementById(this.HIGHSCORE_PANEL_ELEMENT_ID);
  this.highscoreButton = document.getElementById(this.HIGHSCORE_BUTTON_ELEMENT_ID);

  this.submitButton = document.getElementById(this.SUBMIT_BUTTON_ELEMENT_ID);
  this.nicknameInput = document.getElementById(this.NICKNAME_ELEMENT_ID);
  this.nicknameInvalid = document.getElementById(this.NICKNAME_INVALID_ELEMENT_ID);
  this.submitStatus = document.getElementById(this.SUBMIT_STATUS_ELEMENT_ID);
  
  this.submitButton.addEventListener('click', this);
  this.highscoreButton.addEventListener('click', this);

  this._updateUILevelIndicator(this.MIN_CPM);
}

TypeTestScoreHandler.prototype.handleEvent = function(evt) {
  if (!evt.target) {
    return;
  }

  switch (evt.type) {
    case 'click':
      evt.preventDefault();

      if (evt.target.id === this.HIGHSCORE_BUTTON_ELEMENT_ID || evt.target.parentElement.id === this.HIGHSCORE_BUTTON_ELEMENT_ID) {
        this._toggleHighScorePanel();
      } else if (evt.target.id === this.SUBMIT_BUTTON_ELEMENT_ID) {
        var name = this.nicknameInput.value;
        if(!name.length || /[^a-z0-9]/gi.test(name)){
          this.nicknameInvalid.hidden = false;
        } else{ 
          this._sendNickName(name);
        }
      }

      break;
  }
};

TypeTestScoreHandler.prototype.getHighscore = function(result) {
  Utils.getJSON('/api/highscore')
  .then(function(resp){
    var highscores = JSON.parse(resp);
    var tbody = this.highscorePanel.getElementsByTagName('tbody')[0];
    
    while(tbody.lastChild)
      tbody.removeChild(tbody.lastChild);

    for (var i = 0; i < highscores.length; i++) {
      var score = highscores[i];

      var row = document.createElement('tr');
      if(this.nicknameInput.value && score.nickname == this.nicknameInput.value){
        if(result && score.score == result)
          row.classList.add("success");
        else
          row.classList.add("warning");
      }

      var nn = document.createElement('td');
      nn.appendChild(document.createTextNode(score.nickname));
      var sc = document.createElement('td');
      sc.appendChild(document.createTextNode(score.score));
      var cpm = document.createElement('td');
      cpm.appendChild(document.createTextNode(score.charPerMinute + '(' + score.error + ')'));
      
      row.appendChild(nn);
      row.appendChild(sc);
      row.appendChild(cpm);
      
      tbody.appendChild(row);
    };

    this.highscorePanel.hidden = false;

  }.bind(this)).catch(function(e){
      console.error(e);
  });
};

TypeTestScoreHandler.prototype._toggleHighScorePanel = function() {
  if(this.highscorePanel.hidden === false){
    this.highscorePanel.hidden = true;
  } else {
    this.getHighscore();
  }
};

TypeTestScoreHandler.prototype._sendNickName = function(nickname) {
  //TODO validate data
  if(!nickname)
    return;

  this.nicknameInput.disabled = true;
  this.submitButton.disabled = true;

  //send data to server
  return Utils.postJSON('/api/nickname/' + this.typeTestHandler._typeTestSessionId, {nickname: nickname})
  .then(function(result){
    var score = (result.indexOf('Score:') == 0) ? result.substr(6) : null;
    this.getHighscore(score);
  }.bind(this))
  .catch(function(e){
    this.submitStatus.textContent = 'Something went wrong, please try to submit again';
    this.nicknameInput.disabled = false;
    this.submitButton.disabled = false;
    console.error(e);
  }.bind(this));
};

TypeTestScoreHandler.prototype.stop = function() {
  clearInterval(this.progressInterval);
};

TypeTestScoreHandler.prototype.startTyping = function(sentenceLength) {
  this.hideScore();
  this._startProgressBar(sentenceLength);
};

TypeTestScoreHandler.prototype.stopTyping = function() {
  this._stopProgressBar();
};

TypeTestScoreHandler.prototype.updateLevel = function() {
  var currentLevel = this.currentLevel();
  if(currentLevel <= this.nrOfLevels){
    var charPerMin = this._getCharPerMinute(currentLevel, this.nrOfLevels);
    this._updateUILevelIndicator(charPerMin, currentLevel);
  }
};

TypeTestScoreHandler.prototype.showScore = function() {
  this.scorePanel.hidden = false;
};

TypeTestScoreHandler.prototype.showDonePanel = function() {
  if(this.completedSentencesCount > 4){
    if(this.completedSentencesCount === this.nrOfSentences){

      this.donePanel.classList.add('finished');
    }
    else{
      this.donePanel.classList.add('time-is-up');
    }

    this.donePanel.hidden = false;
  }
  else
    this.resetPanel.hidden = false;
};

TypeTestScoreHandler.prototype.hideScore = function() {
  this.scorePanel.hidden = true;
};

TypeTestScoreHandler.prototype.addCompletedSentence = function(res) {
  ++this.completedSentencesCount;
  var lastTouch = res.data[res.data.length -1];
  var currentEditDistance = Utils.getEditDistance(res.typedSequence, res.sentence.s);

  this.totalTimeCount += lastTouch.time;
  this.totalTypedCharCount += res.typedSequence.length;
  this.totalSentenceCharCount += res.sentence.s.length;
  this.totalEditDistCount += currentEditDistance;
  
  //current cpm
  var currentScore = getScore(lastTouch.time, res.typedSequence.length, res.sentence.s.length, currentEditDistance);
  this.lastCpm.innerHTML = currentScore.cpm;
  this.lastEditDist.innerHTML = currentEditDistance;
  this.lastError.innerHTML = currentScore.error + '%';
  
  //total cpm
  var totalScore = getScore(this.totalTimeCount, this.totalTypedCharCount, this.totalSentenceCharCount, this.totalEditDistCount);
  this.totalCpm.innerHTML = totalScore.cpm;
  this.totalError.innerHTML = totalScore.error + '%';
  
  //typed sequence
  this.lastSentence.lastChild.textContent = res.typedSequence;
  this.typedSentence.lastChild.textContent = res.sentence.s;
};

function getScore(time, typedLength, sentenceLength, wrongCharCount){
  var tm = 60000 / time;
  return{
    cpm: Math.floor(tm * typedLength),
    error: Math.floor(wrongCharCount * 100 / sentenceLength)
  };
}

TypeTestScoreHandler.prototype._getCharPerSec = function(level, nrOfLevels){
  return this._getCharPerMinute(level,nrOfLevels) / 60;
}

TypeTestScoreHandler.prototype._getCharPerMinute = function(level, nrOfLevels){
  var increasePerLevel = (this.MAX_CPM - this.MIN_CPM) / (nrOfLevels-1);
  return Math.floor(this.MIN_CPM + (level-1) * increasePerLevel);
};

TypeTestScoreHandler.prototype._getUpdatePercent = function(totalMs){
  //keon is kinda slow
  if(totalMs > 15000)
    return 5;
  if(totalMs > 10000)
    return 10;
  else 
    return 20;
}

TypeTestScoreHandler.prototype._startProgressBar = function(sentenceLength) {
  if(this.progressInterval !== -1)
    throw new Error('Can\'t start progressbar if it is still running.');

  var charPerSec =  this._getCharPerSec(this.currentLevel(), this.nrOfLevels);
  var totalMs = sentenceLength / charPerSec * 1000;
  var updatePercent = this._getUpdatePercent(totalMs);
  var stepTime = totalMs / 100 * updatePercent;
  var currentPercentage = 100;

  this.progressInterval = setInterval(function (){
    window.requestAnimationFrame(function(){
      currentPercentage -= updatePercent;
    this._setProgressBar(currentPercentage);
    if(currentPercentage <= 0){
      this._setProgressBar(0);
      clearInterval(this.progressInterval);
      this.progressInterval = -1;
      this.typeTestHandler.timeIsUp();
    } else {
      this._setProgressBar(currentPercentage);
    }
    }.bind(this));
  }.bind(this), stepTime);
};

TypeTestScoreHandler.prototype._setProgressBar = function(percentage) {
  this.progressBar.style.width = percentage + '%';
};

TypeTestScoreHandler.prototype._stopProgressBar = function() {
  clearInterval(this.progressInterval);
  this.progressInterval = -1;
  this._setProgressBar(100);
};

TypeTestScoreHandler.prototype._updateUILevelIndicator = function(charPerMin, currentLevel) {
  while(this.currentLevelElement.lastChild)
    this.currentLevelElement.removeChild(this.currentLevelElement.lastChild);

  this.currentLevelElement.appendChild(document.createTextNode(currentLevel + ' ( ' + charPerMin + 'CPM )'));
};

exports.TypeTestScoreHandler = TypeTestScoreHandler;

}(window));