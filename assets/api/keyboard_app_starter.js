'use strict';

(function(exports) {

  var BivariateGaussHelper = (function () {
    function BivariateGaussHelper() {
    }
    BivariateGaussHelper.prototype._mean = function (x) {
        var sum = 0;
        for (var i = 0; i < x.length; i++) {
            sum += x[i];
        }
        var mean = sum / x.length;
        return mean;
    };
    BivariateGaussHelper.prototype._variance = function (x, mean) {
        if (!mean)
            mean = this._mean(x);
        var variance = 0;
        for (var i = 0; i < x.length; i++) {
            variance += Math.pow(x[i] - mean, 2);
        }
        variance = variance / (x.length - 1);
        return variance;
    };
    BivariateGaussHelper.getDeterminant = function (matrix) {
        //[a b; c d]
        //det = ad - bc
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    };
    BivariateGaussHelper.getInverseMatrix = function (matrix, determinant) {
        // I = [1 0; 0 1] = identity matrix
        // A = [a b; c d] = [varX cov; cov varY] = input matrix
        // A^-1 = [? ?;? ?] = inverse matrix
        // Where A * A^-1 = I
        // Steps:
        // A^-1 = 1/det(A) * adj(A)
        // det(A) = a*d - b*c
        // adj(A) = [d -b; -c a] = [varY -cov; -cov varX]
        if (matrix.length !== 2 || matrix[0].length !== 2 || matrix[1].length !== 2)
            throw new Error('Expected a 2 by 2 input matrix');
        if (matrix[0][1] !== matrix[1][0])
            throw new Error('Expected input matrix: [varX cov; cov varY]');
        if (!determinant)
            determinant = this.getDeterminant(matrix);
        var inverseMatrix = [];
        inverseMatrix[0] = [];
        inverseMatrix[1] = [];
        //Take negative
        inverseMatrix[0][1] = inverseMatrix[1][0] = -matrix[0][1] / determinant;
        //swap a and d
        inverseMatrix[0][0] = matrix[1][1] / determinant;
        inverseMatrix[1][1] = matrix[0][0] / determinant;
        return inverseMatrix;
    };
    BivariateGaussHelper.getDistributionStatistics = function (x, y) {
        var meanX = this.prototype._mean(x), meanY = this.prototype._mean(y), covariance = 0, varianceX = 0, varianceY = 0;
        for (var i = 0; i < x.length; i++) {
            varianceX += Math.pow(+x[i] - meanX, 2);
            varianceY += Math.pow(+y[i] - meanY, 2);
            covariance += (+x[i] - meanX) * (+y[i] - meanY);
        }
        varianceX = varianceX / (x.length - 1);
        varianceY = varianceY / (x.length - 1);
        covariance = covariance / (x.length - 1);
        if (isNaN(varianceX))
            return;
        else
            return new KeyDistributionParameters(meanX, meanY, varianceX, varianceY, covariance);
    };
    return BivariateGaussHelper;
})();
var BivariateGauss = (function () {
    function BivariateGauss(keyDistribution) {
        this.keyDistribution = keyDistribution;
        this.covMatrix = [];
        this.covMatrix[0] = [keyDistribution.varianceX, keyDistribution.covariance];
        this.covMatrix[1] = [keyDistribution.covariance, keyDistribution.varianceY];
        this.determinant = BivariateGaussHelper.getDeterminant(this.covMatrix);
        this.inverseMatrix = BivariateGaussHelper.getInverseMatrix(this.covMatrix, this.determinant);
    }
    BivariateGauss.prototype.pdf = function (x, y) {
        // pdf = (2*Math.PI)^(-nrOfDimensions/2) * determinant^.5 * e^(-1/2 * ([x y]-[meanX meanY])' * inverseMatrix * ([x y]-[meanX meanY]))
        // mu as row vector [muX muY]
        // Subtract mu from given coordinate
        // [x y]-[muX muY]
        x = x - this.keyDistribution.meanX;
        y = y - this.keyDistribution.meanY;
        //  Multiply the inversematrix with new x and y 'vector'
        //  inverseMatrix * ([x y]-[muX muY])
        var v1 = this.inverseMatrix[0][0] * x + this.inverseMatrix[0][1] * y;
        var v2 = this.inverseMatrix[1][0] * x + this.inverseMatrix[1][1] * y;
        // Multiply new variables with ([x y]-[muX muY])'
        // ([x y]-[muX muY])' * inverseMatrix * ([x y]-[muX muY])
        var v3 = x * v1 + y * v2;
        var result = Math.exp(-.5 * v3) / (2 * Math.PI * Math.sqrt(this.determinant));
        return result;
    };
    BivariateGauss.prototype.mahalanobis = function (x, y) {
        // Subtract mu from given coordinate
        // [x y]-[muX muY]
        x = x - this.keyDistribution.meanX;
        y = y - this.keyDistribution.meanY;
        //  Multiply the inversematrix with new x and y 'vector'
        //  inverseMatrix * ([x y]-[muX muY])
        var v1 = this.inverseMatrix[0][0] * x + this.inverseMatrix[0][1] * y;
        var v2 = this.inverseMatrix[1][0] * x + this.inverseMatrix[1][1] * y;
        // Multiply new variables with ([x y]-[muX muY])'
        // ([x y]-[muX muY])' * inverseMatrix * ([x y]-[muX muY])
        var v3 = x * v1 + y * v2;
        return Math.sqrt(v3);
    };
    return BivariateGauss;
})();

var KeyboardAppStarter = function() {
  this._started = false;
};

// Since the app scripts are dynamic injected, Ctrl+F5 will not clean it up.
// We therefore employ cache busting here by replacing the native appendChild
// methods under <head> and <body>.
// This hash is the Gaia commit hash included in submodule.
KeyboardAppStarter.prototype.CACHE_BUSTING_HASH = 'b47afb4';

KeyboardAppStarter.prototype.start = function() {
  window.history.replaceState(null, '', window.location.hash.substr(1));

  this._getIndexHTMLContent()
    .then(this._prepareDOM.bind(this))
    .catch(function(e) { console.error(e); });

  window.addEventListener('message', this);

  this._startAPI();
  this._replaceAppendChild();
  this._emulator = new EmulateTouchEvents();
};

KeyboardAppStarter.prototype._startAPI = function() {
  navigator.mozSettings = new NavigatorMozSettings();
  navigator.mozSettings.start();

  navigator.mozInputMethod = new InputMethod();
  navigator.mozInputMethod.start();

  window.resizeTo = function(width, height) {
    window.parent.postMessage({
      api: 'resizeTo',
      args: [width, height]
    } , '*');
  };

  if (!window.AudioContext && window.webkitAudioContext) {
    window.AudioContext = window.webkitAudioContext;
  }

  if (!('vibrate' in navigator)) {
    navigator.vibrate = function() { };
  };

  if (!('performance' in window)) {
    window.performance = {
      timing: {
      },
      now: function() { }
    };
  }

  if (!exports.WeakMap) {
    exports.WeakMap = exports.Map;
  } else if (navigator.userAgent.indexOf('Safari') !== -1) {
    // Workarounds broken WeakMap implementation in JavaScriptCode
    // See https://bugs.webkit.org/show_bug.cgi?id=137651
    var weakMapPrototypeSet = exports.WeakMap.prototype.set;
    exports.WeakMap.prototype.set = function(key, val) {
      if (key instanceof HTMLElement) {
        key.webkitWeakMapWorkaround = 1;
      }
      weakMapPrototypeSet.call(this, key, val);
    };
  }
};



KeyboardAppStarter.prototype.handleEvent = function(evt) {
  var data = evt.data;

  if (data.api !== 'api') {
    return;
  }

  switch (data.method) {
    case 'updateHash':
      window.location.replace('#' + data.result);

      break;
    case 'stopEmulateTouchEvents':
      this._emulator.stop();
      window.parent.postMessage({
        api: 'demo',
        method: 'emulateStopped',
        data: data.data
      }, '*');
      break;
    case 'startEmulateTouchEvents':
      setTimeout(function(){
        this._emulator.start(evt.data.data);
      }.bind(this), 800);
      break;
    case 'injectModel':
      var keyDistributions = data.data,
          touchModel = {};
      for (var prop in keyDistributions) {
        if(keyDistributions.hasOwnProperty(prop)){
          touchModel[prop] = new BivariateGauss(keyDistributions[prop]);
        }
      };
      app.targetHandlersManager.activeTargetsManager.userPressManager.touchModel = touchModel;
      break;
  }
};

KeyboardAppStarter.prototype._replaceAppendChild = function() {
  var nativeAppendChild = document.body.appendChild;
  var app = this;

  document.body.appendChild =
  document.documentElement.firstElementChild.appendChild = function(node) {
    var url;

    switch (node.nodeName) {
      case 'SCRIPT':
        // Reject l10n.js request --
        // it doesn't work without running build script
        if (/l10n\.js$/.test(node.src)) {
          return;
        }

        url = node.src.replace(/apps\/keyboard\/shared/, 'shared');

        node.src = url + '?_=' + app.CACHE_BUSTING_HASH;
        break;

      case 'LINK':
        // Redirect shared CSS
        url = node.href.replace(/apps\/keyboard\/shared/, 'shared');

        node.href = url + '?_=' + app.CACHE_BUSTING_HASH;
        break;
    }

    return nativeAppendChild.call(this, node);
  };
};

KeyboardAppStarter.prototype._getIndexHTMLContent = function() {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '');
    xhr.responseType = 'document';
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(e) {
      reject(e);
    };
    xhr.send();
  }.bind(this));
};

KeyboardAppStarter.prototype._prepareDOM = function(sourceDoc) {
  // Clean up the document.
  document.documentElement.firstElementChild.innerHTML = '';
  document.body.innerHTML = '';

  var destHeadNode = document.documentElement.firstElementChild;

  // Copy the imported DOM into the document.
  var sourceHeadNode = document.importNode(
    sourceDoc.documentElement.firstElementChild, true);
  var sourceBodyNode = document.importNode(sourceDoc.body, true);

  ['../../../assets/api.css'].forEach(function(url) {
      var el = document.createElement('link');
      el.href = url;
      el.rel = 'stylesheet';
      destHeadNode.appendChild(el);
    });

  Array.prototype.forEach.call(sourceHeadNode.children, function(node, i) {
    if (node.nodeName === 'SCRIPT') {
      // Script elements needs to be recreated;
      // imported ones doesn't trigger actual script load.
      var el = document.createElement('script');
      el.src = node.src;
      el.async = false;
      destHeadNode.appendChild(el);
    } else {
      // clone the node so we don't mess with the original collection list.
      destHeadNode.appendChild(node.cloneNode(true));
    }
  });

  Array.prototype.forEach.call(sourceBodyNode.children, function(node) {
    // clone the node so we don't mess with the original collection list.
    document.body.appendChild(node.cloneNode(true));
  });
};

exports.KeyboardAppStarter = KeyboardAppStarter;

}(window));
