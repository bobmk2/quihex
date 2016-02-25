'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Wrapper fs for promise
 */

var FileUtil = function () {
  function FileUtil() {
    _classCallCheck(this, FileUtil);
  }

  _createClass(FileUtil, [{
    key: 'readJsonFilePromise',
    value: function readJsonFilePromise(path) {
      return new Promise(function (resolve, reject) {
        _jsonfile2.default.readFile(path, function (err, obj) {
          if (err) {
            reject(err);
          }
          resolve(obj);
        });
      });
    }
  }, {
    key: 'readFilePromise',
    value: function readFilePromise(path) {
      return new Promise(function (resolve, reject) {
        _fs2.default.readFile(path, 'utf-8', function (err, obj) {
          if (err) {
            reject(err);
          }
          resolve(obj);
        });
      });
    }
  }, {
    key: 'writeFilePromise',
    value: function writeFilePromise(path, text, encoding) {
      return new Promise(function (resolve, reject) {
        _fs2.default.writeFile(path, text, encoding, function (err) {
          if (err) {
            reject(err);
          }
          resolve(path);
        });
      });
    }
  }, {
    key: 'isEqualTextOfTwoFiles',
    value: function isEqualTextOfTwoFiles(firstFilePath, secondFilePath) {
      return Promise.all([this.readFilePromise(firstFilePath), this.readFilePromise(secondFilePath)]).then(function (results) {
        return Promise.resolve(results[0] === results[1]);
      });
    }
  }, {
    key: 'readDir',
    value: function readDir(path) {
      return new Promise(function (resolve, reject) {
        _fs2.default.readdir(path, function (err, files) {
          if (err) {
            reject(err);
          }
          resolve(files);
        });
      });
    }
  }]);

  return FileUtil;
}();

exports.default = new FileUtil();