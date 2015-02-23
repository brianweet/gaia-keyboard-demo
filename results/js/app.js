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
	'export-button'
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
	  },
	  handleEvent: function(evt){
	  	evt.preventDefault();
	  	if(evt.currentTarget.id === this.dom.getResultsButton.id){
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
		  	}.bind(this))
	  	} else if(evt.currentTarget.id === this.dom.resultCanvas.id){
	  		if(!this.renderer)
	  			return;

	  		var coords = this.dom.resultCanvas.relMouseCoords(evt);
	  		var charCode = this.renderer.keyboard.charCodeFromCoordinates(coords.x, coords.y);
	  		console.log(coords.x, coords.y);
	  		if(charCode != this.renderer.renderedCharCode){
	  			this.canvasCtx.clearRect(0, 0, this.dom.resultCanvas.width, this.dom.resultCanvas.height);
	  			this.renderer.render(charCode);
	  		}
	  	} else if(evt.currentTarget.id === this.dom.exportButton.id){
	  		if(window.localStorage){
		  		var localVal = window.localStorage.getItem(this.dom.nicknameInput.value);
		  		if(localVal !== null){
		  			var results = JSON.parse(localVal);
		  			var touchEv = Export.touchEvents(results.sentences);
		  			var sen = Export.sentences(results.sentences);
		  			download(Export.toCsv(touchEv), 'touchEvents.csv');
		  			download(Export.toCsv(sen), 'sentences.csv');
		  		}
		  	}
	  	}
	  },
	  setScreenDimensions: function(screenDimensions){
	  	this.dom.resultCanvas.width = screenDimensions.width;
  		this.dom.resultCanvas.height = screenDimensions.height;
	  }
	};

	function processData(results){
		this.setScreenDimensions(results.session.screenDimensions);
		var offset = results.session.screenDimensions.height - results.session.keys.height;
		var keyboard = new Keyboard(this.canvasCtx, results.session.width, results.session.height, offset, results.session.keys.keys);
		this.renderer = new TouchEventRenderer(this.canvasCtx, keyboard, results.sentences);
		this.renderer.render();
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