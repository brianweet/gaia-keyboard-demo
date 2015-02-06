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
    return Math.floor(this.countCompletedSentences / this.sentencesPerLevel) + 1;
  };

  this.countCompletedSentences = 0;
  this.countTotalTime = 0;
  this.countTotalChar = 0;
  this.countTotalWrongChar = 0;
  this.progressInterval = -1;
};

TypeTestScoreHandler.prototype.SCORE_PANEL_ELEMENT_ID = 'score-panel';
TypeTestScoreHandler.prototype.DONE_PANEL_ELEMENT_ID = 'done-panel';
TypeTestScoreHandler.prototype.PROGRESS_BAR_ELEMENT_ID = 'progress-bar';
TypeTestScoreHandler.prototype.LAST_SENTENCE_ELEMENT_ID = 'last-sentence';
TypeTestScoreHandler.prototype.LAST_CORRECT_CPM_ELEMENT_ID = 'correct-cpm';
TypeTestScoreHandler.prototype.LAST_WRONG_CPM_ELEMENT_ID = 'error-percentage';
TypeTestScoreHandler.prototype.TOTAL_CORRECT_CPM_ELEMENT_ID = 'correct-cpm-total';
TypeTestScoreHandler.prototype.TOTAL_WRONG_CPM_ELEMENT_ID = 'error-percentage-total';

TypeTestScoreHandler.prototype.LAST_CORRECT_CHAR_ELEMENT_ID = 'correct-char';
TypeTestScoreHandler.prototype.LAST_WRONG_CHAR_ELEMENT_ID = 'wrong-char';
TypeTestScoreHandler.prototype.TOTAL_CORRECT_CHAR_ELEMENT_ID = 'correct-char-total';
TypeTestScoreHandler.prototype.TOTAL_WRONG_CHAR_ELEMENT_ID = 'wrong-char-total';
TypeTestScoreHandler.prototype.CURRENT_LEVEL_ELEMENT_ID = 'type-test-current-level';

TypeTestScoreHandler.prototype.MIN_CPM = 60;
TypeTestScoreHandler.prototype.MAX_CPM = 300;

TypeTestScoreHandler.prototype.start = function() {
  console.log('TypeTestScoreHandler: start');

  this.scorePanel = document.getElementById(this.SCORE_PANEL_ELEMENT_ID);
  this.donePanel = document.getElementById(this.DONE_PANEL_ELEMENT_ID);
  this.currentLevelElement = document.getElementById(this.CURRENT_LEVEL_ELEMENT_ID);
  this.progressBar = document.getElementById(this.PROGRESS_BAR_ELEMENT_ID);
  this.lastSentence = document.getElementById(this.LAST_SENTENCE_ELEMENT_ID);

  this.correctCpm = document.getElementById(this.LAST_CORRECT_CPM_ELEMENT_ID);
  this.wrongCpm = document.getElementById(this.LAST_WRONG_CPM_ELEMENT_ID);
  this.totalCorrectCpm = document.getElementById(this.TOTAL_CORRECT_CPM_ELEMENT_ID);
  this.totalWrongCpm = document.getElementById(this.TOTAL_WRONG_CPM_ELEMENT_ID);

  this.correctChar = document.getElementById(this.LAST_CORRECT_CHAR_ELEMENT_ID);
  this.wrongChar = document.getElementById(this.LAST_WRONG_CHAR_ELEMENT_ID);
  this.totalCorrectChar = document.getElementById(this.TOTAL_CORRECT_CHAR_ELEMENT_ID);
  this.totalWrongChar = document.getElementById(this.TOTAL_WRONG_CHAR_ELEMENT_ID);

  this.lastSentence.appendChild(document.createTextNode(''));

  this._updateUILevelIndicator(this.MIN_CPM);
}

TypeTestScoreHandler.prototype.stop = function() {
  console.log('TypeTestScoreHandler: stop');
  this.countTotalTime = 0;
  this.countTotalChar = 0;
  this.countTotalWrongChar = 0;

  this.scorePanel = null;

  while(this.lastSentence.lastChild){
    this.lastSentence.removeChild(this.lastSentence.lastChild);
  }
  this.lastSentence = null;

  this.correctCpm = null;
  this.wrongCpm = null;
  this.totalCorrectCpm = null;
  this.totalWrongCpm = null;

  this.correctChar = null;
  this.wrongChar = null;
  this.totalCorrectChar = null;
  this.totalWrongChar = null;
};

TypeTestScoreHandler.prototype.startTyping = function(sentenceLength) {
  console.log('TypeTestScoreHandler: startTyping');
  this.hideScore();
  this._startProgressBar(sentenceLength);
};

TypeTestScoreHandler.prototype.stopTyping = function() {
  console.log('TypeTestScoreHandler: stopTyping');
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
  this.donePanel.style.display = '';
};

TypeTestScoreHandler.prototype.hideScore = function() {
  this.scorePanel.style.display = 'none';
};

TypeTestScoreHandler.prototype.addCompletedSentence = function(res) {
  console.log('TypeTestScoreHandler: addCompletedSentence');
  ++this.countCompletedSentences;
  var lastTouch = res.data[res.data.length -1];
  this.countTotalTime += lastTouch.time;
  this.countTotalChar += res.sentence.s.length;
  this.countTotalWrongChar += res.wrongCharCount;
  
  //current cpm
  var tm = 60000 / lastTouch.time;
  this.correctCpm.innerHTML = 
    Math.floor(tm * res.sentence.s.length);
  this.wrongCpm.innerHTML = 
    Math.floor(res.wrongCharCount * 100 / res.sentence.s.length)  + '%';

  //total cpm
  var tmTotal = 60000 / this.countTotalTime;
  this.totalCorrectCpm.innerHTML = 
    Math.floor(tmTotal * this.countTotalChar);
  this.totalWrongCpm.innerHTML = 
    Math.floor(this.countTotalWrongChar * 100 / this.countTotalChar) + '%';

  //current char count
  this.correctChar.innerHTML = res.sentence.s.length;
  this.wrongChar.innerHTML = res.wrongCharCount;

  //total char count
  this.totalCorrectChar.innerHTML = this.countTotalChar;
  this.totalWrongChar.innerHTML = this.countTotalWrongChar;

  //typed sequence
  this.lastSentence.lastChild.textContent = res.typedSequence;
};

TypeTestScoreHandler.prototype._getCharPerMinute = function(level, nrOfLevels){
  var increasePerLevel = (this.MAX_CPM - this.MIN_CPM) / (nrOfLevels-1);
  return Math.floor(this.MIN_CPM + (level-1) * increasePerLevel);
};

TypeTestScoreHandler.prototype._startProgressBar = function(sentenceLength) {
  if(this.progressInterval !== -1)
    throw new Error('Can\'t start progressbar if it is still running.');

  var charPerMin = this._getCharPerMinute(this.currentLevel(), this.nrOfLevels);
  var charPerSec =  charPerMin / 60;
  var totalMs = sentenceLength / charPerSec * 1000;
  var updatePercent = 5;
  var stepTime = totalMs / 100 * updatePercent;
  var currentPercentage = 100;

  this.progressInterval = setInterval(function (){
    currentPercentage -= updatePercent;
    this._setProgressBar(currentPercentage);
    if(currentPercentage <= 0){
      this._setProgressBar(0);
      console.log('TypeTestScoreHandler: time is up!');
      clearInterval(this.progressInterval);
      this.progressInterval = -1;
      this.typeTestHandler.timeIsUp();
    } else {
      this._setProgressBar(currentPercentage);
    }
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