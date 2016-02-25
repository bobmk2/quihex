'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pathExists = require('path-exists');

var _pathExists2 = _interopRequireDefault(_pathExists);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fsSync = require('fs-sync');

var _fsSync2 = _interopRequireDefault(_fsSync);

var _expandTilde = require('expand-tilde');

var _expandTilde2 = _interopRequireDefault(_expandTilde);

var _fileUtil = require('./file-util');

var _fileUtil2 = _interopRequireDefault(_fileUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QuiverUtil = function () {
  function QuiverUtil() {
    _classCallCheck(this, QuiverUtil);
  }

  _createClass(QuiverUtil, [{
    key: 'validQuiverLib',
    value: function validQuiverLib(qvLibPath) {
      var expandPath = (0, _expandTilde2.default)(qvLibPath);

      // quiver will have default notebook for trash
      var trashNotebook = _path2.default.join(expandPath, 'Trash.qvnotebook');

      return (0, _pathExists2.default)(expandPath).then(function (exists) {
        if (!exists) {
          return Promise.reject(new Error('Input Quiver library path is not found. [' + qvLibPath + ']'));
        }
        return (0, _pathExists2.default)(trashNotebook);
      }).then(function (exists) {
        if (!exists) {
          return Promise.reject(new Error('Input Quiver library path will be not quiver library.(Needs Trash.qvnotebook) [' + qvLibPath + ']'));
        }
        return Promise.resolve();
      });
    }
  }, {
    key: 'getNotePaths',
    value: function getNotePaths(notebookPath) {
      return _fileUtil2.default.readDir(notebookPath).then(function (files) {
        var paths = files.map(function (file) {
          return _path2.default.join(notebookPath, file);
        });
        return Promise.resolve(paths);
      }).then(function (paths) {
        return Promise.resolve(paths.filter(function (filepath) {
          return _path2.default.extname(filepath) === '.qvnote';
        }));
      });
    }

    /**
     * return all notebook meta file
     */

  }, {
    key: 'getAllNotebookMetaFiles',
    value: function getAllNotebookMetaFiles(qvLibPath) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _fs2.default.readdir(qvLibPath, function (err, files) {
          if (err) {
            reject(err);
          }
          resolve(files);
        });
      }).then(function (files) {
        // filter un-notebook files
        return Promise.all(files.map(function (file) {
          return _this._validNotebook(qvLibPath, file);
        })).then(function (results) {
          return files.filter(function (file, idx) {
            return results[idx];
          });
        });
      }).then(function (files) {
        return Promise.all(files.filter(function (file) {
          var basename = _path2.default.basename(file, '.qvnotebook');
          return basename !== 'Trash' && basename !== 'Inbox';
        }).map(function (fileName) {
          return _this.loadNotebookMeta(qvLibPath, fileName);
        }));
      });
    }
  }, {
    key: '_validNotebook',
    value: function _validNotebook(qvLibPath, notebookDirName) {
      return (0, _pathExists2.default)(_path2.default.join(qvLibPath, notebookDirName)).then(function (exists) {
        if (!exists) {
          return Promise.reject();
        }
        return new Promise(function (resolve) {
          if (_path2.default.extname(notebookDirName) !== '.qvnotebook' || !_fsSync2.default.isDir(_path2.default.join(qvLibPath, notebookDirName))) {
            resolve(false);
          }
          resolve(true);
        });
      }).then(function (result) {
        if (!result) {
          return Promise.reject();
        }
        return (0, _pathExists2.default)(_path2.default.join(qvLibPath, notebookDirName, 'meta.json'));
      }).then(function (exists) {
        if (!exists) {
          return Promise.reject();
        }
        return Promise.resolve(true);
      }).catch(function () {
        return Promise.resolve(false);
      });
    }
  }, {
    key: 'loadNotebookMeta',
    value: function loadNotebookMeta(qvLibPath, notebookFileName) {
      return _fileUtil2.default.readJsonFilePromise(_path2.default.join(qvLibPath, notebookFileName, 'meta.json'));
    }
  }, {
    key: 'loadNoteFile',
    value: function loadNoteFile(notePath) {

      var metaPath = _path2.default.join(notePath, 'meta.json');
      var contentPath = _path2.default.join(notePath, 'content.json');

      return (0, _pathExists2.default)(metaPath).then(function (exists) {
        if (!exists) {
          return Promise.reject(new Error('Notebook meta file is not found [' + metaPath + ']'));
        }
        return (0, _pathExists2.default)(contentPath);
      }).then(function (exists) {
        if (!exists) {
          return Promise.reject(new Error('Notebook content file is not found [' + contentPath + ']'));
        }
        return Promise.all([_fileUtil2.default.readJsonFilePromise(metaPath), _fileUtil2.default.readJsonFilePromise(contentPath)]);
      }).then(function (results) {
        return {
          meta: results[0],
          content: results[1]
        };
      });
    }
  }, {
    key: 'convertToHexoPostObj',
    value: function convertToHexoPostObj(noteObj) {
      return new Promise(function (resolve) {
        var title = noteObj.meta.title;
        var tags = noteObj.meta.tags;

        var obj = {};
        obj.filename = title.split(' ').join('-');
        obj.title = title;

        var cdate = new Date(noteObj.meta.created_at * 1000);
        var toDD = function toDD(val) {
          return ('0' + val).slice(-2);
        };
        obj.date = cdate.getFullYear() + '-' + toDD(cdate.getMonth() + 1) + '-' + toDD(cdate.getDate()) + ' ' + toDD(cdate.getHours()) + ':' + toDD(cdate.getMinutes()) + ':' + toDD(cdate.getSeconds());

        obj.tags = tags;
        obj.content = noteObj.content.cells.filter(function (cell) {
          return cell.type === 'markdown';
        }).map(function (cell) {
          return cell.data;
        }).join('\n\n');

        resolve(obj);
      });
    }
  }]);

  return QuiverUtil;
}();

exports.default = new QuiverUtil();