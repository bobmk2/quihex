'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _pathExists = require('path-exists');

var _pathExists2 = _interopRequireDefault(_pathExists);

var _quiverUtil = require('./utils/quiver-util');

var _quiverUtil2 = _interopRequireDefault(_quiverUtil);

var _fileUtil = require('./utils/file-util');

var _fileUtil2 = _interopRequireDefault(_fileUtil);

var _hexoUtil = require('./utils/hexo-util');

var _hexoUtil2 = _interopRequireDefault(_hexoUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QuihexCore = function () {
  function QuihexCore() {
    _classCallCheck(this, QuihexCore);
  }

  _createClass(QuihexCore, [{
    key: 'validQuiverLib',
    value: function validQuiverLib(quiverLibPath) {
      return _quiverUtil2.default.validQuiverLib(quiverLibPath);
    }
  }, {
    key: 'validHexoRoot',
    value: function validHexoRoot(hexoRootPath) {
      return _hexoUtil2.default.validHexoRoot(hexoRootPath);
    }
  }, {
    key: 'getAllNotebookMetaFiles',
    value: function getAllNotebookMetaFiles(quiverLibPath) {
      return _quiverUtil2.default.getAllNotebookMetaFiles(quiverLibPath);
    }
  }, {
    key: 'getUserNotebookNames',
    value: function getUserNotebookNames(config) {
      return _quiverUtil2.default.getAllNotebookMetaFiles(config.quiver).then(function (notebooks) {
        if (notebooks.length === 0) {
          return Promise.reject(new Error('Please create one or more your notebooks.'));
        }
        return Promise.resolve(notebooks.map(function (notebooks) {
          return notebooks.name;
        }));
      });
    }
  }, {
    key: 'getSyncNoteFilePaths',
    value: function getSyncNoteFilePaths(quihexConfig) {
      return this._getSyncNotebookPath(quihexConfig).then(function (syncNotebookPath) {
        return _quiverUtil2.default.getNotePaths(syncNotebookPath);
      }).then(function (paths) {
        return Promise.resolve(paths.filter(function (filepath) {
          return _path2.default.extname(filepath) === '.qvnote';
        }));
      });
    }
  }, {
    key: '_getSyncNotebookPath',
    value: function _getSyncNotebookPath(quihexConfig) {
      return new Promise(function (resolve) {
        resolve(_path2.default.join(quihexConfig.quiver, quihexConfig.syncNotebook.uuid + '.qvnotebook'));
      });
    }
  }, {
    key: 'getAllBlogStatus',
    value: function getAllBlogStatus(config, notePaths) {
      var _this = this;

      return Promise.all(notePaths.map(function (notePath) {
        return _quiverUtil2.default.loadNoteFile(notePath).then(function (note) {
          return _quiverUtil2.default.convertToHexoPostObj(note);
        }).then(function (hexoPostObj) {
          return _this._getBlogStatus(config, hexoPostObj);
        });
      }));
    }
  }, {
    key: 'writeAsHexoPosts',
    value: function writeAsHexoPosts(config, hexoPostObj) {
      return _hexoUtil2.default.loadHexoConfig(config.hexo).then(function (hexoConfig) {
        var postsRoot = _path2.default.join(config.hexo, hexoConfig.source_dir, '_posts');
        var filePath = _path2.default.join(postsRoot, hexoPostObj.filename + '.md');

        return _fileUtil2.default.writeFilePromise(filePath, _hexoUtil2.default.toHexoPostString(hexoPostObj), 'utf-8');
      });
    }
  }, {
    key: '_getBlogStatus',
    value: function _getBlogStatus(quihexConfig, hexoPostObj) {
      return _hexoUtil2.default.loadHexoConfig(quihexConfig.hexo).then(function (hexoConfig) {

        var postsRoot = _path2.default.join(quihexConfig.hexo, hexoConfig.source_dir, '_posts');
        var lastFilePath = _path2.default.join(postsRoot, hexoPostObj.filename + '.md');

        var createStatus = function createStatus(status) {
          return {
            hexoPostObj: hexoPostObj,
            status: status
          };
        };

        // if quihex note has not sync tag, skip sync it.
        if (hexoPostObj.tags.filter(function (tag) {
          return quihexConfig.tagsForNotSync.indexOf(tag) !== -1;
        }).length > 0) {
          return Promise.resolve(createStatus('skip'));
        }

        return (0, _pathExists2.default)(lastFilePath).then(function (exists) {

          // it is new if last file is not found
          if (!exists) {
            return Promise.resolve(createStatus('new'));
          }

          return _fileUtil2.default.readFilePromise(lastFilePath).then(function (lastPosts) {
            var isEqual = lastPosts === _hexoUtil2.default.toHexoPostString(hexoPostObj);
            return Promise.resolve(createStatus(isEqual ? 'stable' : 'update'));
          });
        });
      });
    }
  }]);

  return QuihexCore;
}();

exports.default = new QuihexCore();