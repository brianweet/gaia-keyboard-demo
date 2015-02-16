/* exported AppManager */
'use strict';

var AppManager = {

  init: function init() {
    this.isInitialized = true;

    Tutorial.init();
    Tutorial.start();

    window.addEventListener('tutorialdone', tuturialDone);
    function tuturialDone(){
      window.location = 'index.html';
    }
  }
};

AppManager.init();
