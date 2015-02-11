'use strict';

(function(exports) {

var InputMethodHandler = function(app) {
  this.app = app;
  this._selectionStart = -1;
  this._text = '';

  this._currentText = '';
};

InputMethodHandler.prototype.start = function() {
};

InputMethodHandler.prototype.clear = function() {
  this._text = this._currentText = '';
};

InputMethodHandler.prototype.handleMessage = function(data) {
  switch (data.api) {
    case 'inputcontext':
      this.handleInputContextMessage(data);

      break;

    case 'inputmethodmanager':
      this.handleInputMethodManagerMessage(data);

      break;
  }
};

InputMethodHandler.prototype.handleInputContextMessage = function(data) {
  switch (data.method) {
    case 'getText':
      var text = this._currentText;

      this.app.postMessage({
        api: data.api,
        contextId: data.contextId,
        id: data.id,
        result: text
      });

      break;

    case 'sendKey':
      var charCode = data.args[1];
      if (charCode) {
        this._handleInput('append', String.fromCharCode(data.args[1]));
      } else {
        switch (data.args[0]) {
          case 0x08: // DOM_VK_BACKSPACE
            this._handleInput('backspace');

            break;

          case 0x0D: // DOM_VK_RETURN
            this._handleInput('return');

            break;

          default:
            console.log(data.args[0]);

            break;
        }
      }

      this._updateSelectionContext();

      this.app.postMessage({
        api: data.api,
        contextId: data.contextId,
        id: data.id,
        result: ''
      });

      break;

    case 'replaceSurroundingText':
      this._handleInput('replace', data.args[0], data.args[1], data.args[2]);

      this._updateSelectionContext();

      this.app.postMessage({
        api: data.api,
        contextId: data.contextId,
        id: data.id,
        result: this.getSelectionInfo()
      });

      break;

    case 'deleteSurroundingText':
      this._handleInput('replace', '', data.args[0], data.args[1]);

      this._updateSelectionContext();

      this.app.postMessage({
        api: data.api,
        contextId: data.contextId,
        id: data.id,
        result: this.getSelectionInfo()
      });

      break;

    case 'setComposition':
      this._handleInput('updateComposition', data.args[0]);

      this._updateSelectionContext();

      this.app.postMessage({
        api: data.api,
        contextId: data.contextId,
        id: data.id,
        result: ''
      });

      break;

    case 'endComposition':
      this._handleInput('append', data.args[0]);

      this._updateSelectionContext();

      this.app.postMessage({
        api: data.api,
        contextId: data.contextId,
        id: data.id,
        result: ''
      });

      break;

    case 'setSelectionRange':

      this.app.postMessage({
        api: data.api,
        contextId: data.contextId,
        id: data.id,
        error: 'Unimplemented'
      });

      break;
  }
};

InputMethodHandler.prototype.handleInputMethodManagerMessage = function(data) {
  switch (data.method) {
    case 'showAll':
      this.app.layouts.showSelectionDialog();

      break;

    case 'next':
      this.app.layouts.switchToNext();

      break;

    case 'hide':
      this.app.removeFocus();

      break;
  }
};

InputMethodHandler.prototype._handleInput = function(job, str, offset, length) {
  switch (job) {
    case 'append':
      this.app.typeTestHandler.checkInputChar(str);
      
      this._currentText += str;

      break;

    case 'return':
      this._currentText += '\n';

      break;

    case 'backspace':
      this._currentText =
        this._currentText.substr(0, this._currentText.length - 1);

      break;

    case 'replace':
      var text = this._currentText;
      this._currentText = text.substr(0, text.length + offset) + str;
      if (offset !== - length) {
        this._currentText += text.substr(text.length + offset + length);
      }

      break;
  }
};

InputMethodHandler.prototype.getSelectionInfo = function() {
  var text = this._currentText;
  var selectionStart = text.length;
  var changed = (text !== this._text ||
    selectionStart !== this._selectionStart);

  this._text = text;
  this._selectionStart = selectionStart;

  return {
    selectionStart: selectionStart,
    selectionEnd: selectionStart,
    textBeforeCursor: text,
    textAfterCursor: '',
    changed: changed
  }
};

InputMethodHandler.prototype._updateSelectionContext = function() {
  this.app.postMessage({
    api: 'inputcontext',
    method: 'updateSelectionContext',
    result: {
      selectionInfo: this.getSelectionInfo(),
      // Our implementation does not currently allow user to change
      // selection or text on the fake input,
      // therefore all events should have ownAction set to true.
      ownAction: true
    }
  });
};

exports.InputMethodHandler = InputMethodHandler;

}(window));
