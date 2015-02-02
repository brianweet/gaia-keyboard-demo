'use strict';

(function(exports) {

var TypeTestScoreHandler = function(app) {
  this.app = app;
  this.countTotalTime = 0;
  this.countTotalChar = 0;
  this.countTotalWrongChar = 0;
};

TypeTestScoreHandler.prototype.SCORE_PANEL_ELEMENT_ID = 'score-panel';
TypeTestScoreHandler.prototype.PROGRESS_BAR_ELEMENT_ID = 'progress-bar';
TypeTestScoreHandler.prototype.LAST_SENTENCE_ELEMENT_ID = 'last-sentence';
TypeTestScoreHandler.prototype.LAST_CORRECT_CPM_ELEMENT_ID = 'correct-cpm';
TypeTestScoreHandler.prototype.LAST_WRONG_CPM_ELEMENT_ID = 'wrong-cpm';
TypeTestScoreHandler.prototype.TOTAL_CORRECT_CPM_ELEMENT_ID = 'correct-cpm-total';
TypeTestScoreHandler.prototype.TOTAL_WRONG_CPM_ELEMENT_ID = 'wrong-cpm-total';

TypeTestScoreHandler.prototype.LAST_CORRECT_CHAR_ELEMENT_ID = 'correct-char';
TypeTestScoreHandler.prototype.LAST_WRONG_CHAR_ELEMENT_ID = 'wrong-char';
TypeTestScoreHandler.prototype.TOTAL_CORRECT_CHAR_ELEMENT_ID = 'correct-char-total';
TypeTestScoreHandler.prototype.TOTAL_WRONG_CHAR_ELEMENT_ID = 'wrong-char-total';

TypeTestScoreHandler.prototype.start = function() {
  console.log('TypeTestScoreHandler: start');
  this.scorePanel = document.getElementById(this.SCORE_PANEL_ELEMENT_ID);
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
  this.startProgressBar(sentenceLength);
};

TypeTestScoreHandler.prototype.startProgressBar = function(sentenceLength) {
  var charPerMin;
  if(this.countTotalChar < 10){
    charPerMin = 60;
  } else if (this.countTotalChar < 50){
    charPerMin = 90;
  } else if (this.countTotalChar < 100){
    charPerMin = 120;
  } else if (this.countTotalChar < 200){
    charPerMin = 150;
  } else if (this.countTotalChar < 300){
    charPerMin = 180;
  }
  var charPerSec =  charPerMin / 60;
  var totalMs = sentenceLength / charPerSec * 1000;
  var updatePercent = 5;
  var stepTime = totalMs / 100 * updatePercent;
  var currentPercentage = 100;

  this.progressInterval = setInterval(function (){
    currentPercentage -= updatePercent;
    this.setProgressBar(currentPercentage);
    if(currentPercentage <= 0){
      this.setProgressBar(0);
      console.log('TypeTestScoreHandler: time is up!');
      clearInterval(this.progressInterval);
    }else{
      this.setProgressBar(currentPercentage);
    }
  }.bind(this), stepTime);
};

TypeTestScoreHandler.prototype.setProgressBar = function(percentage) {
  this.progressBar.style.width = percentage + '%';
};

TypeTestScoreHandler.prototype.stopProgressBar = function() {
  this.setProgressBar(100);
  clearInterval(this.progressInterval);
};

TypeTestScoreHandler.prototype.showScore = function(sentenceResult) {
  this.addSentence(sentenceResult);
  this.scorePanel.style.display = '';
};

TypeTestScoreHandler.prototype.hideScore = function() {
  this.scorePanel.style.display = 'none';
};

TypeTestScoreHandler.prototype.addSentence = function(res) {
  console.log('TypeTestScoreHandler: addSentence');
  var lastTouch = res.data[res.data.length -1];
  this.countTotalTime += lastTouch.time;
  this.countTotalChar += res.sentence.s.length;
  this.countTotalWrongChar += res.wrongCharCount;
  
  //current cpm
  var tm = 60000 / lastTouch.time;
  this.correctCpm.innerHTML = 
    Math.floor(tm * res.sentence.s.length);
  this.wrongCpm.innerHTML = 
    Math.floor(tm * res.wrongCharCount);

  //total cpm
  var tmTotal = 60000 / this.countTotalTime;
  this.totalCorrectCpm.innerHTML = 
    Math.floor(tmTotal * this.countTotalChar);
  this.totalWrongCpm.innerHTML = 
    Math.floor(tmTotal * this.countTotalWrongChar);

  //current char count
  this.correctChar.innerHTML = res.sentence.s.length;
  this.wrongChar.innerHTML = res.wrongCharCount;

  //total char count
  this.totalCorrectChar.innerHTML = this.countTotalChar;
  this.totalWrongChar.innerHTML = this.countTotalWrongChar;

  //typed sequence
  this.lastSentence.lastChild.textContent = res.typedSequence;
};

exports.TypeTestScoreHandler = TypeTestScoreHandler;

}(window));