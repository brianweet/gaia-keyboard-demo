/* exported AppManager, Utils */
'use strict';

function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

(function(exports) {
  	'use strict';

	var elementIDs = [
	'result-canvas',
	'nickname-input',
	'get-results-button',
	'export-button',
	'emulate-frame',
	'sentence-select',
	'sentence-span',
	'result-span'
	];

	var AppManager = {

	  // Most used DOM elements
	  dom: {},
	  canvasCtx: {},

	  init: function init() {
	    this.isInitialized = true;

	    // first time here: cache DOM elements
		elementIDs.forEach(function(name) {
			this.dom[Utils.camelCase(name)] = document.getElementById(name);
			if (!this.dom[Utils.camelCase(name)]) {
			  console.error('Cache DOM elements: couldnt cache: ' + name);
			}
		}, this);

		this.canvasCtx = this.dom.resultCanvas.getContext('2d');
		this.dom.resultCanvas.addEventListener('mousemove',this);

		this.dom.getResultsButton.addEventListener('click',this);
		this.dom.exportButton.addEventListener('click',this);
		this.dom.sentenceSelect.addEventListener('change',this);
	  },
	  handleEvent: function(evt){
	  	evt.preventDefault();
	  	switch(evt.currentTarget){
	  		case this.dom.getResultsButton:
	  			loadData.call(this);
	  			break;
	  		case this.dom.resultCanvas:
	  			handleCanvasEvent.call(this, evt);	
	  			break;
	  		case this.dom.exportButton:
	  			exportData.call(this);
	  			break;
	  		case this.dom.sentenceSelect:
	  			handleSentenceSelectChange.call(this, evt);
	  			break;
	  	}
	  },
	  setScreenDimensions: function(screenDimensions){
	  	this.dom.emulateFrame.width = this.dom.resultCanvas.width = screenDimensions.width;
  		this.dom.emulateFrame.height = this.dom.resultCanvas.height = screenDimensions.height;
  		this.dom.emulateFrame.contentWindow.location.reload();
	  }
	};

	function exportData(){
		if(window.localStorage){
	  		var localVal = window.localStorage.getItem(this.dom.nicknameInput.value);
	  		if(localVal !== null){
	  			var results = JSON.parse(localVal);
	  			var offset = results.session.screenDimensions.height - results.session.keys.height;
	  			var touchEv = Export.touchEvents(results.sentences, results.session.keys.keys, offset);
	  			var sen = Export.sentences(results.sentences);
	  			download(Export.toCsv(touchEv), 'touchEvents.csv');
	  			download(Export.toCsv(sen), 'sentences.csv');
	  		}
	  	} else {
	  		console.error('First load data');
	  	}
	}

	function handleCanvasEvent(evt){
		if(!this.renderer)
  			return;

  		var coords = this.dom.resultCanvas.relMouseCoords(evt);
  		var charCode = this.renderer.keyboard.charCodeFromCoordinates(coords.x, coords.y);
  		if(charCode != this.renderer.renderedCharCode){
  			this.canvasCtx.clearRect(0, 0, this.dom.resultCanvas.width, this.dom.resultCanvas.height);
  			this.renderer.render(charCode);
  		}
	}

	function handleSentenceSelectChange(evt){
		var sentenceRes = this.results.sentences.filter(function(s){
			return s.id == this.dom.sentenceSelect.value
		}.bind(this))[0];

		this.dom.sentenceSpan.textContent = sentenceRes.sentence.s;
		this.dom.resultSpan.textContent = sentenceRes.typedSequence;

		this.canvasCtx.clearRect(0, 0, this.dom.resultCanvas.width, this.dom.resultCanvas.height);
		this.renderer.sentenceResults.length = 0;
		this.renderer.sentenceResults.push(sentenceRes);
		this.renderer.render();
		
		if(sentenceRes.data.length)
		this.dom.emulateFrame.contentWindow.postMessage({
			api: 'api',
			method: 'emulateTouchEvents',
			data: sentenceRes.data
		}, '*');
	}

	function loadData(){
		if(window.localStorage){
	  		var localVal = window.localStorage.getItem(this.dom.nicknameInput.value);
	  		if(localVal !== null){
	  			var results = JSON.parse(localVal);
	  			processData.call(this, results);
	  			return;
	  		}
	  	}

	  	Utils.getJSON('/api/results/' + this.dom.nicknameInput.value).then(function(res){
	  		if(window.localStorage)
	  			window.localStorage.setItem(this.dom.nicknameInput.value, res);
	  		var results = JSON.parse(res);
	  		processData.call(this, results);
	  	}.bind(this));
	}

	function fillSelect(options){
		//remove old options
		while(this.dom.sentenceSelect.lastChild)
			this.dom.sentenceSelect.removeChild(this.dom.sentenceSelect.lastChild);

		//add default
		var opt = document.createElement('option');
		opt.innerHTML = 'Select a sentence to emulate';
		opt.value = '';
		this.dom.sentenceSelect.appendChild(opt);

		//add sentences
		for(var i = 0; i < options.length; i++) {
			var current = options[i];
		    opt = document.createElement('option');
		    opt.innerHTML = current.sentence.id + ':' + current.sentence.s + '(' + current.wrongCharCount + ' wrong)' ;
		    opt.value = current.id;
		    this.dom.sentenceSelect.appendChild(opt);
		}
	}

	function processData(results){
		this.results = results;
		this.setScreenDimensions(results.session.screenDimensions);
		var offset = results.session.screenDimensions.height - results.session.keys.height;
		var keyboard = new Keyboard(this.canvasCtx, results.session.width, results.session.height, offset, results.session.keys.keys);
		this.renderer = new TouchEventRenderer(this.canvasCtx, keyboard, results.sentences);
		this.renderer.render();

		fillSelect.call(this, results.sentences);
  	}

  	function download(stringToDownload, filename){
  		var hiddenElement = document.createElement('a');

		hiddenElement.href = 'data:attachment/text,' + encodeURI(stringToDownload);
		hiddenElement.target = '_blank';
		hiddenElement.download = filename;
		hiddenElement.click();
  	}

	

	exports.Utils = Utils;
	exports.AppManager = AppManager;
}(this));

AppManager.init();