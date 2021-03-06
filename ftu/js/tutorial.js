/* global Promise, Utils */
/* exported Tutorial */

(function(exports) {
  'use strict';

  // default layout
  var currentLayout = 'tiny';

  // Most used DOM elements
  var dom = {};

  /**
   * Helper function to load imagaes and video
   * @param {DOMNode} mediaElement  video or image to assign new src to
   * @param {String} src  URL for video/image resource
   * @returns {Promise}
   */
  function _loadMedia(mediaElement, src) {
    return new Promise(function(resolve, reject) {
      function onMediaLoadOrError(evt) {
        evt.target.removeEventListener('error', onMediaLoadOrError);
        evt.target.removeEventListener('load', onMediaLoadOrError);
        // Dont block progress on failure to load media
        if (evt.type === 'error') {
          console.error('Failed to load tutorial media: ' + src);
        } else {
          mediaElement.hidden = false;
        }
        
        resolve(evt);
      }
      function onVideoUnloaded(evt) {
        mediaElement.removeEventListener('emptied', onVideoUnloaded);
        mediaElement.removeEventListener('abort', onVideoUnloaded);
        mediaElement.addEventListener('canplay', onMediaLoadOrError);
        mediaElement.src = src;
        mediaElement.load();
      }

      mediaElement.addEventListener('load', onMediaLoadOrError, false);
      mediaElement.addEventListener('error', onMediaLoadOrError, false);
      mediaElement.src = src;
    });
  }

  var elementIDs = [
    'tutorial',
    'tutorial-step-title',
    'tutorial-step-media',
    'tutorial-step-image',
    'tutorial-step-link',
    'forward-tutorial',
    'back-tutorial'
  ];

  /**
   * Manages and controls the configuration, content and state of the tutorial
   * @module Tutorial
   */
  var Tutorial = {
    // A configuration object.
    config: null,

    // Config for the current tutorial steps
    _stepsConfig: {},

    // Keeps track of the current step
    _currentStep: 1,

    // Track initialized state of tutorial
    _initialized: false,

    /**
     * Initialize the tutorial. This is async as a config file must be loaded.
     * A Sequence (array of sync or async functions) is used to manage the init
     * tasks.
     * When complete, the tutorial is ready to be shown via the 'start' method
     *
     * @param {String} stepsKey a key into the tutorial config object, i
     *                          i.e. a version or version delta like 1.3..2.0
     * @param {Function} onLoaded  optional callback for when init is complete
     * @memberof Tutorial
    */
    init: function(stepsKey, onLoaded) {
      // init is async
      // need to load config, then load the first step and its assets.
      if (this._initialized || this._initialization) {
        // init already underway
        return;
      }

      var initTasks = this._initialization = new Sequence(
        // config should load or already be loaded.
        // failure should abort
        this._init.bind(this)
      );
      initTasks.onabort = this._onAbortInitialization.bind(this);
      initTasks.oncomplete =
        this._onCompleteInitialization.bind(this, onLoaded);

      // first time here: cache DOM elements
      elementIDs.forEach(function(name) {
        dom[Utils.camelCase(name)] = document.getElementById(name);
        if (!dom[Utils.camelCase(name)]) {
          console.error('Cache DOM elements: couldnt cache: ' + name);
        }
      }, this);

      initTasks.next();
    },

    /**
     * Show the tutorial and play the first step
     * May be called during or after the init process
     * We defer rasing the 'tutorialinitialized' event until this point
     * as it signals the tutorial step content is loaded and displayed
     *
     * @param {Function} onReady  optional callback for when start is complete
     * @memberof Tutorial
     */
    start: function(onReady) {
      var sequence;
      var initInProgress = false;
      if (this._initialization) {
        // init still underway, tack steps onto existing sequence
        sequence = this._initialization;
        initInProgress = true;
      } else {
        // init already complete, create new sequence
        this._initialization = sequence = new Sequence();
        sequence.onabort = this._onAbortInitialization.bind(this);
        sequence.oncomplete =
          this._onCompleteInitialization.bind(this);
      }
      sequence.push(function setInitialStep() {
        // setStep should return promise given by _loadMedia
        return this._setStep();
      }.bind(this));

      sequence.push(function showTutorialAndFinishInit() {
        // Show the panel
        dom.tutorial.classList.add('show');
        // Custom event that can be used to apply (screen reader) visibility
        // changes.
        window.dispatchEvent(new CustomEvent('tutorialinitialized'));
      });

      if(typeof onReady === 'function') {
        sequence.push(onReady);
      }

      if (!initInProgress) {
        // init done, starting start sequence
        sequence.next();
      }
    },

    _init: function() {
      this._stepsConfig = 
        {
          steps: [{
                  "image":"/ftu/style/images/brian.jpg",
                  "text": "Hi, my name is Brian and I would like to do some science"
                },
                {
                  "image":"/ftu/style/images/backspace.png",
                  "text": "I am trying to improve the gaia keyboard. To do so I created an app to collect typing data. The keyboard does not have a backspace, which means you don't have to worry about errors."
                },
                {
                  "image":"/ftu/style/images/sentence.png",
                  "text": "The 'game' is simple, first read the given sentence, then remember the given sentence and eventually type the given sentence."
                },
                {
                  "image":"/ftu/style/images/return.png",
                  "text": "When you are done with the sentence, you can press the return key."
                },
                {
                  "image":"/ftu/style/images/normal.jpg",
                  "text": "Try to type as you would do in a normal situation. There is no need to prevent errors (or to make errors on purpose).",
                  "link": "http://variationsonnormal.com/2011/04/28/finger-nose-stylus-for-touchscreens/",
                  "linkTitle": "Picture by Dominic Wilcox"
                }]
        };

      // Add event listeners
      dom.forwardTutorial.addEventListener('click', this);
      dom.backTutorial.addEventListener('click', this);

      // Set the first step
      this._currentStep = 1;
    },
    _onAbortInitialization: function() {
      this._initialization = null;
    },
    _onCompleteInitialization: function(onReady) {
      this._initialization = null;
      this._initialized = true;
      if(typeof onReady === 'function') {
        onReady();
      }
    },

    /**
     * Advance the tutorial to the given step (first step if no value given)
     *
     * @param {Number} value number of the step to show (1-based)
     * @memberof Tutorial
     */
    _setStep: function (value) {
      // If value is bigger than the max, show finish screen
      value = (typeof value === 'number') ? value : this._currentStep;
      var stepIndex = value - 1;
      if (stepIndex >= this._stepsConfig.steps.length) {
        return Promise.resolve().then(function() {
          Tutorial.done();
        });
      }

      var stepData = this._stepsConfig.steps[stepIndex];
      if (!stepData) {
        return Promise.reject('No data for step: ' + value);
      }
      // Set the step
      dom.tutorial.dataset.step = this._currentStep;

      // Load data
      dom.tutorialStepTitle.textContent = stepData.text;

      if(stepData.link){
        dom.tutorialStepLink.href = stepData.link;   
        dom.tutorialStepLink.textContent = stepData.linkTitle;  
        dom.tutorialStepLink.hidden = false;   
      } else {
        dom.tutorialStepLink.hidden = true;
      }

      // Update the image
      var imgElement = dom.tutorialStepImage;

      imgElement.hidden = true; 
      var stepPromise = _loadMedia(imgElement, stepData.image);

      return stepPromise;
    },

    /**
     * DOM Event handler
     *
     * @param {DOMEvent} evt Event object
     * @memberof Tutorial
     */
    handleEvent: function(evt) {
      if (evt.type === 'click') {
        switch(evt.target) {
          case dom.forwardTutorial:
            this.next(evt);
            break;
          case dom.backTutorial:
            this.back(evt);
            break;
        }
      }
    },

    /**
     * Advance to the next step in the tutorial
     * @memberof Tutorial
     */
    next: function() {
      return this._setStep(++this._currentStep);
    },

    /**
     * Go back to the previous step in the tutorial
     * @memberof Tutorial
     */
    back: function() {
      return this._setStep(--this._currentStep);
    },

    /**
     * Tutorial complete
     * @memberof Tutorial
     */
    done: function() {
      dom.tutorial.classList.remove('show');
      dom.tutorialStepImage.removeAttribute('src');

      window.dispatchEvent(new CustomEvent('tutorialdone'));
    },

    /**
     * Test helper to reset the tutorial to its pre-initialized state
     * to allow init to be called again
     * @memberof Tutorial
     */
    reset: function() {
      if (this._initialization) {
        this._initialization.abort();
        this._initialization = null;
      }
      this._configPromise = null;
      this._currentStep = 1;
      this._stepsConfig = this.config = null;
      if (this._initialized) {
        dom.tutorial.classList.remove('show');
        this._initialized = false;
      }
    }
  };

  /**
   * Private helper class to manage a series of sync or async functions
   *
   * The array may be manipulated using standard array methods while the
   * sequence runs. The sequence completes when there are no more functions or
   * an exception is raised.
   * At the end of the sequence, any 'oncomplete' assigned will be called with
   * the return value from the last function
   * Functions may return a 'thenable' to indicate async return
   * Exceptions will be passed into the oncomplete function
   * A Sequence may be cleanly aborted by calling abort() - no callbacks will
   * be fired
   * @class Sequence
   */
  function Sequence() {
    var sequence =[];
    for( var i in arguments ) {
        if (arguments.hasOwnProperty(i)){
           sequence.push(arguments[i]);
        }
    }

    var aborted = false;
    sequence.abort = function() {
      aborted = true;
      this.length = 0;
      if (typeof this.onabort === 'function') {
        this.onabort();
      }
    };
    sequence.complete = function(result) {
      if(!aborted && typeof this.oncomplete === 'function') {
        this.oncomplete(result);
      }
    };
    sequence.fail = function(reason) {
      this.complete(reason);
    };
    sequence.next = function(previousTaskResult) {
      var result, exception;
      if (aborted) {
        return;
      }
      var task = this.shift();
      if (task) {
        try {
          result = task.apply(null, arguments);
        } catch(e) {
          exception = e;
        }
        if (exception) {
          this.fail(exception);
        } else if (result && typeof result.then === 'function') {
          result.then(this.next.bind(this), this.fail.bind(this));
        } else {
          this.next(result);
        }
      } else {
        this.complete(previousTaskResult);
      }
    };
    return sequence;
  }

  exports.Tutorial = Tutorial;

})(this);
