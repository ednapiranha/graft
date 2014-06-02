(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ImageView = function (options) {
  if (!options) {
    options = {};
  }

  this.preview = options.preview || document.getElementById('preview');

  var canvas = document.createElement('canvas');
  var picField = document.getElementById(options.picField) || document.getElementById('photo');
  var photoSelector = document.getElementById(options.photoSelector) || document.getElementById('photo-picker');
  var quality = parseFloat(options.quality) || 0.4;
  var maxSize = parseInt(options.maxSize, 10) || 100;

  this.generate = function (ev, next) {

    if (!ev.target || (ev.target && !ev.target.files)) {
      throw new Error('This needs to be input[type="file"]');
    }

    var picture = ev.target.files[0];
    var img = new Image();

    preview.innerHTML = '';

    var onComplete = function () {
      canvas.width = img.width;
      canvas.height = img.height;

      if (canvas.width > maxSize) {
        var scale = maxSize / canvas.width;
        canvas.width *= scale;
        canvas.height *= scale;
      }

      if (canvas.height > maxSize) {
        var scale = maxSize / canvas.height;
        canvas.width *= scale;
        canvas.height *= scale;
      }

      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      picField.value = canvas.toDataURL('image/jpeg', quality);
      preview.appendChild(canvas);

      if (next) {
        next();
      }
    };

    img.onload = img.onerror = onComplete;
    img.src = window.URL.createObjectURL(picture);
  };

  this.preview = function () {
    photoSelector.addEventListener('change', this.generate, false);
  };
};

if (typeof define === 'function' && define.amd) {
  define(function () {
    return ImageView;
  });
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageView;
}

},{}],2:[function(require,module,exports){
if (document.getElementById('add-post')) {
  var ImageView = require('imageview');
  var iv = new ImageView();

  iv.preview();
}


},{"imageview":1}]},{},[2])