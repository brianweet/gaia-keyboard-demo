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
  this.totalCharCount = 0;
  this.totalWrongCharCount = 0;
  this.progressInterval = -1;
};

TypeTestScoreHandler.prototype.SCORE_PANEL_ELEMENT_ID = 'score-panel';
TypeTestScoreHandler.prototype.DONE_PANEL_ELEMENT_ID = 'done-panel';
TypeTestScoreHandler.prototype.RESET_PANEL_ELEMENT_ID = 'reset-panel';
TypeTestScoreHandler.prototype.PROGRESS_BAR_ELEMENT_ID = 'progress-bar';
TypeTestScoreHandler.prototype.LAST_SENTENCE_ELEMENT_ID = 'last-sentence';

TypeTestScoreHandler.prototype.LAST_CPM_ELEMENT_ID = 'last-cpm';
TypeTestScoreHandler.prototype.LAST_CORRECT_CPM_ELEMENT_ID = 'last-correct-cpm';
TypeTestScoreHandler.prototype.LAST_ERROR_ELEMENT_ID = 'last-error-percentage';

TypeTestScoreHandler.prototype.TOTAL_CPM_ELEMENT_ID = 'total-cpm';
TypeTestScoreHandler.prototype.TOTAL_CORRECT_CPM_ELEMENT_ID = 'total-correct-cpm';
TypeTestScoreHandler.prototype.TOTAL_ERROR_ELEMENT_ID = 'total-error-percentage';

TypeTestScoreHandler.prototype.LAST_CHAR_ELEMENT_ID = 'last-char';
TypeTestScoreHandler.prototype.LAST_CORRECT_CHAR_ELEMENT_ID = 'last-correct-char';
TypeTestScoreHandler.prototype.LAST_WRONG_CHAR_ELEMENT_ID = 'last-wrong-char';

TypeTestScoreHandler.prototype.TOTAL_CHAR_ELEMENT_ID = 'total-char';
TypeTestScoreHandler.prototype.TOTAL_CORRECT_CHAR_ELEMENT_ID = 'total-correct-char';
TypeTestScoreHandler.prototype.TOTAL_WRONG_CHAR_ELEMENT_ID = 'total-wrong-char';

TypeTestScoreHandler.prototype.CURRENT_LEVEL_ELEMENT_ID = 'type-test-current-level';

TypeTestScoreHandler.prototype.HIGHSCORE_PANEL_ELEMENT_ID = 'highscore-panel';
TypeTestScoreHandler.prototype.HIGHSCORE_BUTTON_ELEMENT_ID = 'highscore-button';

TypeTestScoreHandler.prototype.MIN_CPM = 60;
TypeTestScoreHandler.prototype.MAX_CPM = 300;

TypeTestScoreHandler.prototype.start = function() {
  this.scorePanel = document.getElementById(this.SCORE_PANEL_ELEMENT_ID);
  this.donePanel = document.getElementById(this.DONE_PANEL_ELEMENT_ID);
  this.resetPanel = document.getElementById(this.RESET_PANEL_ELEMENT_ID);
  this.currentLevelElement = document.getElementById(this.CURRENT_LEVEL_ELEMENT_ID);
  this.progressBar = document.getElementById(this.PROGRESS_BAR_ELEMENT_ID);
  this.lastSentence = document.getElementById(this.LAST_SENTENCE_ELEMENT_ID);

  this.lastCpm = document.getElementById(this.LAST_CPM_ELEMENT_ID);
  this.lastCorrectCpm = document.getElementById(this.LAST_CORRECT_CPM_ELEMENT_ID);
  this.lastError = document.getElementById(this.LAST_ERROR_ELEMENT_ID);
  
  this.totalCpm = document.getElementById(this.TOTAL_CPM_ELEMENT_ID);
  this.totalCorrectCpm = document.getElementById(this.TOTAL_CORRECT_CPM_ELEMENT_ID);
  this.totalError = document.getElementById(this.TOTAL_ERROR_ELEMENT_ID);

  this.lastChar = document.getElementById(this.LAST_CHAR_ELEMENT_ID);
  this.lastCorrectChar = document.getElementById(this.LAST_CORRECT_CHAR_ELEMENT_ID);
  this.lastWrongChar = document.getElementById(this.LAST_WRONG_CHAR_ELEMENT_ID);

  this.totalChar = document.getElementById(this.TOTAL_CHAR_ELEMENT_ID);
  this.totalCorrectChar = document.getElementById(this.TOTAL_CORRECT_CHAR_ELEMENT_ID);
  this.totalWrongChar = document.getElementById(this.TOTAL_WRONG_CHAR_ELEMENT_ID);
  this.lastSentence.appendChild(document.createTextNode(''));

  this.highscorePanel = document.getElementById(this.HIGHSCORE_PANEL_ELEMENT_ID);
  this.highscoreButton = document.getElementById(this.HIGHSCORE_BUTTON_ELEMENT_ID);
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
      }

      break;
  }
};

TypeTestScoreHandler.prototype.getHighscore = function() {
  Utils.getJSON('/api/highscore')
  .then(function(resp){
    var highscores = JSON.parse(resp);
    var tbody = this.highscorePanel.getElementsByTagName('tbody')[0];
    
    while(tbody.lastChild)
      tbody.removeChild(tbody.lastChild);

    for (var i = 0; i < highscores.length; i++) {
      var score = highscores[i];

      var row = document.createElement('tr');
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

    this.highscorePanel.style.display = '';

  }.bind(this)).catch(function(e){
      console.error(e);
  });
};

TypeTestScoreHandler.prototype._toggleHighScorePanel = function() {
  if(this.highscorePanel.style.display === ''){
    this.highscorePanel.style.display = 'none';
  } else {
    this.getHighscore();
  }
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
  this.scorePanel.style.display = '';
};

TypeTestScoreHandler.prototype.showDonePanel = function() {
  if(this.completedSentencesCount > 4){
    if(this.completedSentencesCount === this.nrOfSentences)
      this.donePanel.classList.add('finished');
    else
      this.donePanel.classList.add('time-is-up');

    this.donePanel.style.display = '';
  }
  else
    this.resetPanel.style.display = '';
};

TypeTestScoreHandler.prototype.hideScore = function() {
  this.scorePanel.style.display = 'none';
};

TypeTestScoreHandler.prototype.addCompletedSentence = function(res) {
  ++this.completedSentencesCount;
  var lastTouch = res.data[res.data.length -1];
  this.totalTimeCount += lastTouch.time;
  this.totalCharCount += res.sentence.s.length;
  this.totalWrongCharCount += res.wrongCharCount;
  
  //current cpm
  var currentScore = getScore(lastTouch.time, res.sentence.s.length, res.wrongCharCount);
  this.lastCpm.innerHTML =  currentScore.cpm;
  this.lastCorrectCpm.innerHTML = currentScore.correctCpm;
  this.lastError.innerHTML = currentScore.error  + '%';

  //total cpm
  var totalScore = getScore(this.totalTimeCount, this.totalCharCount, this.totalWrongCharCount);
  this.totalCpm.innerHTML = totalScore.cpm;
  this.totalCorrectCpm.innerHTML = totalScore.correctCpm;
  this.totalError.innerHTML = totalScore.error + '%';

  //current char count
  this.lastChar.innerHTML = res.sentence.s.length;
  this.lastCorrectChar.innerHTML = res.sentence.s.length - res.wrongCharCount;
  this.lastWrongChar.innerHTML = res.wrongCharCount;

  //total char count
  this.totalChar.innerHTML = this.totalCharCount;
  this.totalCorrectChar.innerHTML = this.totalCharCount - this.totalWrongCharCount;
  this.totalWrongChar.innerHTML = this.totalWrongCharCount;

  //typed sequence
  this.lastSentence.lastChild.textContent = res.typedSequence;
};

function getScore(time, sentenceLength, wrongCharCount){
  var tm = 60000 / time;
  return{
    cpm: Math.floor(tm * sentenceLength),
    correctCpm: Math.floor(tm * (sentenceLength - wrongCharCount)),
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