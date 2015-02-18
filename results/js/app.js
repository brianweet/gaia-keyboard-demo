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

  	var rdashes = /-(.)/g;

	var Utils = {
		camelCase: function ut_camelCase(str) {
		  return str.replace(rdashes, function(str, p1) {
		    return p1.toUpperCase();
		  });
		},
		getJSON: function getJSON(url){
		  return doXHR('get', url);
		},
		postJSON: function postJSON(url, dataObject){
		  return doXHR('post', url, dataObject);
		}
	};

	var elementIDs = [
	'result-canvas',
	'nickname-input',
	'get-results-button'
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
	  		if(!this.keyboard)
	  			return;

	  		var coords = this.dom.resultCanvas.relMouseCoords(evt);
	  		var charCode = this.keyboard.charCodeFromCoordinates(coords.x, coords.y);
	  		if(charCode != this.keyboard.renderedCharCode){
	  			this.canvasCtx.clearRect(0, 0, this.dom.resultCanvas.width, this.dom.resultCanvas.height);
	  			this.keyboard.render(charCode);
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
		this.keyboard = new Keyboard(this.canvasCtx, results.session.width, results.session.height, offset, results.session.keys.keys);
		this.keyboard.addSentenceResults(results.sentences);
		this.keyboard.render();
	  }

	

	exports.Utils = Utils;
	exports.AppManager = AppManager;
}(this));

AppManager.init();