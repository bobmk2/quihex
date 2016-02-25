'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _homePath = require('home-path');

var _homePath2 = _interopRequireDefault(_homePath);

var _pathExists = require('path-exists');

var _pathExists2 = _interopRequireDefault(_pathExists);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _fileUtil = require('./utils/file-util');

var _fileUtil2 = _interopRequireDefault(_fileUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QuihexConfig = function () {
  function QuihexConfig() {
    _classCallCheck(this, QuihexConfig);
  }

  _createClass(QuihexConfig, [{
    key: 'getConfigFilePath',
    value: function getConfigFilePath() {
      return _path2.default.join((0, _homePath2.default)(), '.quihexrc');
    }
  }, {
    key: '_validQuihexConfig',
    value: function _validQuihexConfig(config) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        if (typeof config === 'undefined' || typeof config.hexo === 'undefined' || typeof config.quiver === 'undefined' || typeof config.syncNotebook === 'undefined' || typeof config.syncNotebook.name === 'undefined' || typeof config.syncNotebook.uuid === 'undefined' || typeof config.tagsForNotSync === 'undefined') {
          reject(new Error('Config file is broken. Please remove config file > \'$ rm ' + _this.getConfigFilePath() + '\', and re-init > \'$ quihex init\''));
        }
        resolve(config);
      });
    }
  }, {
    key: 'loadConfig',
    value: function loadConfig() {
      var _this2 = this;

      return (0, _pathExists2.default)(this.getConfigFilePath()).then(function (result) {
        if (!result) {
          return Promise.reject(new Error('Config file is not found. Please init > \'$ quihex init\''));
        }
        return _fileUtil2.default.readJsonFilePromise(_this2.getConfigFilePath());
      }).then(function (config) {
        return _this2._validQuihexConfig(config);
      });
    }
  }, {
    key: 'createConfigObj',
    value: function createConfigObj(quiverLibPath, hexoRootPath, syncNotebook, tagsForNotSync) {
      if (typeof tagsForNotSync === 'undefined' || !tagsForNotSync) {
        tagsForNotSync = ['hide', 'wip', 'secret'];
      }

      return {
        quiver: quiverLibPath,
        hexo: hexoRootPath,
        syncNotebook: syncNotebook,
        tagsForNotSync: tagsForNotSync
      };
    }
  }, {
    key: 'writeConfig',
    value: function writeConfig(configObj) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _jsonfile2.default.writeFile(_this3.getConfigFilePath(), configObj, { spaces: 2 }, function (err) {
          if (err) {
            reject(err);
          }
          resolve();
        });
      });
    }
  }]);

  return QuihexConfig;
}();

exports.default = new QuihexConfig();