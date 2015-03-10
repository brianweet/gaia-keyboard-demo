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
	'sentence-info',
	'sentence-select',
	'session-select',
	'sentence-span',
	'result-span',
	'dist-span',
	'probablility-results',
	'inject-model'
	];

	var AppManager = {

	  // Most used DOM elements
	  dom: {},
	  canvasCtx: {},

	  init: function init() {
	  	// if(window.localStorage)
	  	// 	window.localStorage.clear();

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
		this.dom.resultCanvas.addEventListener('click',this);
		this.dom.getResultsButton.addEventListener('click',this);
		this.dom.injectModel.addEventListener('click',this);
		this.dom.exportButton.addEventListener('click',this);
		this.dom.sentenceSelect.addEventListener('change',this);
		this.dom.sessionSelect.addEventListener('change',this);
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
	  		case this.dom.sessionSelect:
	  			handleSessionSelectChange.call(this, evt);
	  			break;
	  		case this.dom.injectModel:
	  			var map = {};
	  			for (var i = 0; i < this.model.length; i++) {
	  				map[this.model[i].char.charCodeAt(0)] = this.model[i].stat;
	  			};
	  			debugger;
	  			this.dom.emulateFrame.contentWindow.postMessage({
					api: 'demo',
					method: 'injectModel',
					data: map
				}, '*');
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

	function calculateModel(){
		var anEv = [];
		for (var i = 0; i < this.results.sentences.length; i++) {
			var newEv = AnnotationHelper.getAnnotatedEvents(this.renderer.keyboard, this.results.sentences[i]);
			anEv = anEv.concat(newEv);
		};

		var modGen = new ModelGenerator(anEv, this.renderer.keyboard.keys);
		this.model = modGen.calculate();
	}

	function handleCanvasEvent(evt){
		if(!this.renderer)
  			return;

		var coords = this.dom.resultCanvas.relMouseCoords(evt);
  		var charCode = this.renderer.keyboard.charCodeFromCoordinates(coords.x, coords.y);

		if(evt.type === 'mousemove'){
			if(charCode != this.renderer.renderedCharCode){
	  			this.canvasCtx.clearRect(0, 0, this.dom.resultCanvas.width, this.dom.resultCanvas.height);
	  			this.renderer.render(charCode);
	  		}	
		} else {
			if(charCode && this.model){
				if(!this.probablilityResultsTable)
			    this.probablilityResultsTable = $(this.dom.probablilityResults).dataTable({
			        "data": [],
			        "columns": [
			            { "title": "Char" },
			            { "title": "gauss pdf" }
			        ],
					"paging": false
			    }).DataTable();   
	    
				this.probablilityResultsTable.rows().remove();

	  			for (var i = 0; i < this.model.length; i++) {
	  				var prob = this.model[i].stat.calcGauss(coords.x, coords.y);
	  				this.probablilityResultsTable.row.add([ this.model[i].char, prob ]);
	  			};
	  			this.probablilityResultsTable
			    .order([ 1, "desc" ])
			    .draw();
  			}	
		}
	}

	function handleSessionSelectChange(){
		var session = this.highscores.filter(function(s){
			return s.RowKey == this.dom.sessionSelect.value;
		}.bind(this))[0];
		if(session)
			processData.call(this, session);
	}

	function handleSentenceSelectChange(evt){
		var sentenceRes = this.results.sentences.filter(function(s){
			return s.id == this.dom.sentenceSelect.value;
		}.bind(this))[0];

		if(!sentenceRes){
			this.dom.sentenceInfo.hidden = true;
			this.canvasCtx.clearRect(0, 0, this.dom.resultCanvas.width, this.dom.resultCanvas.height);
			this.renderer.setSentenceResults(this.results.sentences);
			this.renderer.render();
			return;
		}

		this.dom.sentenceInfo.hidden = false;
		this.dom.sentenceSpan.textContent = sentenceRes.sentence.s;
		this.dom.resultSpan.textContent = sentenceRes.typedSequence;
		this.dom.distSpan.textContent = Utils.getEditDistance(sentenceRes.sentence.s, sentenceRes.typedSequence);

		this.canvasCtx.clearRect(0, 0, this.dom.resultCanvas.width, this.dom.resultCanvas.height);
		this.renderer.setSentenceResults([sentenceRes]);
		this.renderer.render();
		
		if(sentenceRes.data.length)
		this.dom.emulateFrame.contentWindow.postMessage({
			api: 'demo',
			method: 'emulateTouchEvents',
			data: sentenceRes.data
		}, '*');
	}

	function loadData(){
		this.dom.injectModel.hidden = 
		this.dom.sentenceSelect.hidden = 
		this.dom.sessionSelect.hidden = true;
		if(window.localStorage){
	  		var localVal = window.localStorage.getItem(this.dom.nicknameInput.value);
	  		if(localVal !== null){
	  			var highscores = JSON.parse(localVal);
	  			this.highscores = highscores;
	  			fillSessionSelect.call(this, highscores);
	  			return;
	  		}
	  	}

	  	Utils.getJSON('/api/results/' + this.dom.nicknameInput.value).then(function(res){
	  		if(window.localStorage)
	  			window.localStorage.setItem(this.dom.nicknameInput.value, res);
	  		var highscores = JSON.parse(res);
	  		this.highscores = highscores;
	  		fillSessionSelect.call(this, highscores);
	  	}.bind(this));
	}

	function fillSessionSelect(options){
		this.dom.injectModel.hidden = false;
		
		var opt;
		fillSelect(this.dom.sessionSelect, 'Select a session', options, function(current){
			opt = document.createElement('option');
		    opt.innerHTML = current.nickname + ' - ' + current.Timestamp;
		    opt.value = current.RowKey;
		    this.appendChild(opt);
		});

		this.dom.sessionSelect.value = options[0].RowKey;
		handleSessionSelectChange.call(this);
	}

	function fillSentenceSelect(options){
		var opt;
		fillSelect(this.dom.sentenceSelect, 'Select a sentence to emulate', options, function(current){
			opt = document.createElement('option');
		    opt.innerHTML = current.sentence.id + ':' + current.sentence.s + ' (' + current.wrongCharCount + ' wrong)' ;
		    opt.value = current.id;
		    this.appendChild(opt);
		});
	}

	function fillSelect(el, defaultOptionString, options, optionsFunction){
		el.hidden = false;
		//remove old options
		while(el.lastChild)
			el.removeChild(el.lastChild);

		//add default
		var opt = document.createElement('option');
		opt.innerHTML = defaultOptionString;
		opt.value = '';
		el.appendChild(opt);

		//add sentences
		options.forEach(optionsFunction.bind(el));
	}

	function processData(results){
		this.results = results;
		this.setScreenDimensions(results.session.screenDimensions);
		var offset = results.session.screenDimensions.height - results.session.keys.height;
		var keyboard = new Keyboard(this.canvasCtx, results.session.width, results.session.height, offset, results.session.keys.keys);
		this.renderer = new TouchEventRenderer(this.canvasCtx, keyboard, results.sentences);
		this.renderer.render();

		fillSentenceSelect.call(this, results.sentences);
		calculateModel.call(this);
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