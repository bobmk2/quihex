#!/usr/bin/env node


'use strict';

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _cliColor = require('cli-color');

var _cliColor2 = _interopRequireDefault(_cliColor);

var _quihexCore = require('./quihex-core');

var _quihexCore2 = _interopRequireDefault(_quihexCore);

var _quihexConfig = require('./quihex-config');

var _quihexConfig2 = _interopRequireDefault(_quihexConfig);

var _logTemplate = require('./utils/log-template');

var _logTemplate2 = _interopRequireDefault(_logTemplate);

var _cliColorTemplate = require('./utils/cli-color-template');

var _cliColorTemplate2 = _interopRequireDefault(_cliColorTemplate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ex = function _ex(msg) {
  return _cliColorTemplate2.default.example('(ex. ' + msg + ')');
};

_prompt2.default.message = '' + _cliColorTemplate2.default.notice('Input');
_prompt2.default.delimiter = '' + _cliColor2.default.white(': ');

function onCancel() {
  console.log('\r\n');
  _logTemplate2.default.separator(8);
  _logTemplate2.default.cancel();
  _logTemplate2.default.separator(8);
}

function onError(err) {
  _logTemplate2.default.error(err.message);
}

_commander2.default.command('init').description('Initialize or update quihex config').action(function () {
  tryLoadConfig().then(function (tryConfig) {
    var config = tryConfig.exists ? tryConfig.data : null;
    if (config) {
      _logTemplate2.default.separator(30, '=');
      _logTemplate2.default.warning('Already config file exists.');
      _logTemplate2.default.info('If you don\'t update config, Press enter with nothing.');
      _logTemplate2.default.separator(30, '=');
    }
    return inputQuiverLibPath(config).then(function (quiverLibPath) {
      return inputHexoRootPath(config).then(function (hexoRootPath) {
        return _quihexCore2.default.getAllNotebookMetaFiles(quiverLibPath).then(function (notebookMetaFiles) {
          return inputSyncNotebookName(config, notebookMetaFiles).then(function (syncNotebookName) {
            // Mt. Fuji 🗻🗻🗻
            var selectedIndex = notebookMetaFiles.map(function (meta) {
              return meta.name;
            }).indexOf(syncNotebookName);
            if (selectedIndex === -1) {
              return Promise.reject(new Error('Sync notebook name is not found. [' + syncNotebookName + ']'));
            }
            return _quihexConfig2.default.createConfigObj(quiverLibPath, hexoRootPath, notebookMetaFiles[selectedIndex], config ? config.tagsForNotSync : null);
          }).then(function (configObj) {
            return _quihexConfig2.default.writeConfig(configObj);
          });
        });
      });
    }).then(function () {
      _logTemplate2.default.separator(30);
      _logTemplate2.default.finish('Config file was ' + (config ? 'updated' : 'created') + ' :)');
      _logTemplate2.default.info('path > ' + _cliColorTemplate2.default.script(_quihexConfig2.default.getConfigFilePath()));
      _logTemplate2.default.separator(30);
    });
  }).catch(function (err) {
    onError(err);
  });
});

_commander2.default.command('ls-notebook').description('Show user\'s quiver notebooks').action(function () {
  _quihexConfig2.default.loadConfig().then(function (config) {
    return _quihexCore2.default.getUserNotebookNames(config);
  }).then(function (notebookNames) {
    notebookNames.map(function (nb) {
      console.log('📗  ' + nb);
    });
  }).catch(function (err) {
    onError(err);
  });
});

_commander2.default.command('sync').description('Sync quiver notes with hexo posts').option('-y, --yes', 'Auto input yes').option('-v, --verbose', 'Show all note status').action(function (cmd) {
  var yesOpt = cmd.yes ? true : false;
  var verboseOpt = cmd.verbose ? true : false;

  _quihexConfig2.default.loadConfig().then(function (config) {
    return _quihexCore2.default.getSyncNoteFilePaths(config).then(function (notePaths) {
      return _quihexCore2.default.getAllBlogStatus(config, notePaths);
    }).then(function (results) {
      var statusColor = {
        skip: _cliColorTemplate2.default.skip,
        new: _cliColorTemplate2.default.new,
        update: _cliColorTemplate2.default.update,
        stable: _cliColorTemplate2.default.stable
      };

      results.forEach(function (result) {
        var status = result.status;

        // if verbose option is not set, show only notes with update or new status.
        if (!verboseOpt && ['skip', 'stable'].indexOf(status) !== -1) {
          return;
        }
        console.log(statusColor[status](status.toUpperCase()) + " " + result.hexoPostObj.filename);
      });

      var syncTargetPosts = results.filter(function (result) {
        return ['update', 'new'].indexOf(result.status) !== -1;
      }).map(function (post) {
        return post.hexoPostObj;
      });

      if (syncTargetPosts.length === 0) {
        _logTemplate2.default.info('Already up-to-date');
        return;
      }

      // skip question if yes option is set
      return (yesOpt ? Promise.resolve(true) : inputYesNoConform('Do you sync quiver notes to hexo posts?')).then(function (inputYes) {
        if (!inputYes) {
          _logTemplate2.default.cancel('Quiver notes are not synced.');
          return;
        }
        _logTemplate2.default.separator(30);
        _logTemplate2.default.info('Sync start...');
        return Promise.all(syncTargetPosts.map(function (post) {
          return _quihexCore2.default.writeAsHexoPosts(config, post).then(function (result) {
            _logTemplate2.default.info('Success [' + post.filename + ']');
          });
        })).then(function () {
          _logTemplate2.default.separator(30);
          _logTemplate2.default.finish('Sync succeed');
          _logTemplate2.default.info('Check updated texts at hexo dir, and deploy them :)');
          _logTemplate2.default.separator(30);
        });
      });
    });
  }).catch(function (err) {
    onError(err);
  });
});

function tryLoadConfig() {
  return _quihexConfig2.default.loadConfig().then(function (config) {
    return Promise.resolve({ exists: true, data: config });
  }).catch(function (err) {
    return Promise.resolve({ exists: false, data: null });
  });
}

function inputYesNoConform(description) {
  var question = {
    name: 'yesno',
    description: _cliColorTemplate2.default.question(description + ' [Y/n]'),
    message: 'Please input Y(Yes) or n(no)',
    type: 'string',
    required: true,
    conform: function conform(input) {
      return ['Y', 'Yes', 'n', 'no'].indexOf(input) !== -1;
    }
  };

  return input(question).then(function (answer) {
    var v = answer.yesno.trim();
    return Promise.resolve(['Y', 'Yes'].indexOf(v) !== -1);
  });
}

function inputQuiverLibPath(config) {
  var example = _ex('/Users/you/Library/Quiver.qvlibrary');

  var question = {
    name: 'quiver',
    description: _cliColorTemplate2.default.question(_cliColor2.default.bold('Quiver') + ' library path ' + (config ? '' : example)),
    default: config ? config.quiver : undefined,
    message: 'Please input quiver lib path',
    type: 'string',
    required: true
  };

  return input(question).then(function (answer) {
    var quiverLibPath = answer.quiver.trim();
    return _quihexCore2.default.validQuiverLib(quiverLibPath).then(function () {
      return Promise.resolve(quiverLibPath);
    });
  }).catch(function (err) {
    onError(err);
    // FIXME: will happen stack over flow :(
    return inputQuiverLibPath(config);
  });
}

function inputHexoRootPath(config) {
  var example = _ex('/Users/you/hexo-blog');

  var question = {
    name: 'hexo',
    description: _cliColorTemplate2.default.question(_cliColor2.default.bold('Hexo') + ' root dir path ' + (config ? '' : example)),
    default: config ? config.hexo : undefined,
    message: 'Please input hexo root path',
    type: 'string',
    required: true
  };

  return input(question).then(function (answer) {
    var hexoRootPath = answer.hexo.trim();
    return _quihexCore2.default.validHexoRoot(hexoRootPath).then(function () {
      return Promise.resolve(hexoRootPath);
    });
  }).catch(function (err) {
    onError(err);
    // FIXME: will happen stack over flow :(
    return inputHexoRootPath(config);
  });
}

function inputSyncNotebookName(config, notebookMetaFiles) {
  _logTemplate2.default.separator(18);
  console.log(' 📚  Notebooks 📚  ');
  _logTemplate2.default.separator(18);

  notebookMetaFiles.map(function (nb) {
    console.log('📗  ' + nb.name);
  });

  var example = _ex(notebookMetaFiles[0].name);

  var conformFunc = function conformFunc(inputName) {
    return notebookMetaFiles.map(function (notebook) {
      return notebook.name;
    }).indexOf(inputName) != -1;
  };

  var question = {
    name: 'syncNotebook',
    description: _cliColorTemplate2.default.question('Notebook name for syncing to Hexo ' + (config ? '' : example)),
    message: 'Please set the notebook name for sync',
    default: config && config.syncNotebook ? config.syncNotebook.name : undefined,
    type: 'string',
    required: true,
    conform: conformFunc
  };

  return input(question).then(function (answer) {
    var syncNotebook = answer.syncNotebook;
    return Promise.resolve(syncNotebook);
  }).catch(function (err) {
    onError(err);
  });
}

function input(question) {
  return new Promise(function (resolve, reject) {
    _prompt2.default.start();
    _prompt2.default.get(question, function (err, answer) {

      if (typeof answer === 'undefined') {
        onCancel();
        return;
      }
      if (err) {
        reject(err);
      }
      resolve(answer);
    });
  });
}

_commander2.default.version('0.0.1').parse(process.argv);