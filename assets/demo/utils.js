'use strict';

(function(exports) {

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

  var Utils = {
    getJSON: function getJSON(url){
      return doXHR('get', url);
    },
    postJSON: function postJSON(url, dataObject){
      return doXHR('post', url, dataObject);
    }
  };

  exports.Utils = Utils;

}(this));