'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fileUtil = require('./file-util');

var _fileUtil2 = _interopRequireDefault(_fileUtil);

var _expandTilde = require('expand-tilde');

var _expandTilde2 = _interopRequireDefault(_expandTilde);

var _pathExists = require('path-exists');

var _pathExists2 = _interopRequireDefault(_pathExists);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HexoUtil = function () {
  function HexoUtil() {
    _classCallCheck(this, HexoUtil);
  }

  _createClass(HexoUtil, [{
    key: 'loadHexoConfig',
    value: function loadHexoConfig(hexoRoot) {
      var confPath = _path2.default.join(hexoRoot, '_config.yml');

      return _fileUtil2.default.readFilePromise(confPath).then(function (file) {
        var ymlobj = _jsYaml2.default.safeLoad(file);

        // filter unnecessary fields
        var config = {};
        config.source_dir = ymlobj.source_dir;
        config.date_format = ymlobj.date_format;
        config.time_format = ymlobj.time_format;

        if (!config.source_dir || !config.date_format || !config.time_format) {
          return Promise.reject(new Error('Hexo config file is not valid. [' + _path2.default.join(hexoRoot, '_config.yml') + ']'));
        }

        return Promise.resolve(config);
      });
    }
  }, {
    key: 'validHexoRoot',
    value: function validHexoRoot(hexoRootPath) {
      var expandPath = (0, _expandTilde2.default)(hexoRootPath);

      // there is _config.yml in hexo root
      var hexoConfigPath = _path2.default.join(expandPath, '_config.yml');

      return (0, _pathExists2.default)(expandPath).then(function (exists) {
        if (!exists) {
          return Promise.reject(new Error('Input hexo root path is not found. [' + hexoRootPath + ']'));
        }
        return (0, _pathExists2.default)((0, _expandTilde2.default)(hexoConfigPath));
      }).then(function (exists) {
        if (!exists) {
          return Promise.reject(new Error('Input hexo root path will be not hexo root.(Needs _config.yml) [' + hexoRootPath + ']'));
        }

        return Promise.resolve();
      });
    }
  }, {
    key: 'toHexoPostString',
    value: function toHexoPostString(hexoPostObj) {
      var text = [];
      text.push('----');
      text.push('title: ' + hexoPostObj.title);
      text.push('date: ' + hexoPostObj.date);
      text.push('tags:');
      hexoPostObj.tags.forEach(function (tag) {
        text.push('- ' + tag);
      });
      text.push('----');
      text.push(hexoPostObj.content);
      return text.join('\n');
    }
  }]);

  return HexoUtil;
}();

exports.default = new HexoUtil();