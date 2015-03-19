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

  function getEditDistance(a, b) {
    if(a.length === 0) return b.length; 
    if(b.length === 0) return a.length; 

    var matrix = [];

    // increment along the first column of each row
    var i;
    for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
    }

    return matrix[b.length][a.length];
  };

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
    },
    getEditDistance: getEditDistance
  };

  exports.Utils = Utils;

}(this));


