#!/usr/bin/env node

'use strict';
import command from 'commander';
import clc from 'cli-color';
import clct from './utils/cli-color-template';

import fileUtil from './utils/file-util';
import quiverUtil from './utils/quiver-util';
import hexoUtil from './utils/hexo-util';

import prompt from 'prompt';
import jsonfile from 'jsonfile';
import pathExists from 'path-exists';
import path from 'path';
import getHomePath from 'home-path';
import fs from 'fs';

const APP_NAME = 'quihex';
const CONFIG_FILE_PATH = path.join(getHomePath(), '.quihexrc');

const _ex = (msg) => {
  return clct.example(`(ex. ${msg})`);
};

prompt.message = `${clct.notice('Input')}`;
prompt.delimiter = `${clc.white(': ')}`;

function onCancel() {
  console.log('\r\n--------');
  console.log(clct.notice('Canceled'));
  console.log('--------');
}

function onError(err) {
  console.log(`${clct.error('Error')}: ${err}`);
}

command
  .command('init')
  .action(() => {

    fetchConfig().then((result) => {
      if (result.exists) {
        console.log('====================================');
        console.log(`${clct.warning('Warning')}: Already config file exists.`);
        console.log(`${clct.notice('Info')}: If you don't update config, Enter ${clc.bold('empty')} with nothing.`);
        console.log('====================================');
      }
      var config = result.config;
      var hexoEx = config.hexo ? '' : _ex('/Users/you/hexo-blog');
      var qvLibEx = config.quiver ? '' : _ex('/Users/you/Library/Quiver.qvlibrary');

      prompt.start();
      prompt.get([
        {
          name: 'hexoPath',
          description: clc.bgBlack.white(`${clc.bold('Hexo')} root dir path ${hexoEx}`),
          default: config.hexo
        },
        {
          name: 'quiverLibPath',
          description: clc.bgBlack.white(`${clc.bold('Quiver')} library path ${qvLibEx}`),
          default: config.quiver
        }], (err, result) => {

        if (typeof result === 'undefined') {
          onCancel();
          return;
        }

        var hexoPath = result.hexoPath;
        var quiverLibPath = result.quiverLibPath;

        isValidHexoDir(hexoPath)
          .then(() => {
            return quiverUtil.isValidQuiverLib(quiverLibPath)
          })
          .then((valid) => {
            if (!valid) {
              return Promise.reject(new Error(`Quiver lib file path is invalid [${quiverLibPath}]`));
            }
            return quiverUtil.getAllNotebooksMeta(config.quiver);
          })
          .then((notebooks) => {
            console.log('-----------------');
            console.log(' Found Notebooks ');
            console.log('-----------------');
            notebooks.map((nb) => {
              console.log(`📓  ${nb.name}`);
            });
            return inputSyncNotebook(config.syncNotebook, notebooks);
          })
          .then((syncNotebook) => {
            return createConfig(hexoPath, quiverLibPath, syncNotebook);
          })
          .then(() => {
            console.log('------------------------')
            console.log(`${clct.success('Finished')} :)`);
            console.log(`${clct.notice('Info')}: Config file path is ${clct.script(CONFIG_FILE_PATH)}`);
            console.log('------------------------')
          })
          .catch((err) => {
            onError(err);
          });
      });
    }).catch((err) => {
      onError(err);
    })
  });

command
  .command('ls-notebook')
  .action(() => {
    loadConfig()
      .then((config) => {
        return quiverUtil.getAllNotebooksMeta(config.quiver);
      })
      .then((notebooks) => {
        notebooks.map((notebook) => {
          console.log(`📓  ${notebook.name}`);
        });
      })
      .catch((err) => {
        onError(err);
      });
  });

command
  .command('sync')
  .action(() => {
    var _config;
    loadConfig()
      .then((config) => {
        _config = config;
        return quiverUtil.getNotebookPath(config);
      })
      .then((notebookPath) => {
        return fileUtil.getChildrenFilePaths(notebookPath);
      })
      .then((paths) => {
        var notePaths = paths.filter((filepath) => {
          return path.extname(filepath) === '.qvnote'
        });
        return Promise.all(
          notePaths.map((notepath) => {
              return quiverUtil.loadNoteFile(notepath)
                .then((note) => {
                  return quiverUtil.convertToHexoObj(note);
                })
                .then((hexoObj) => {
                  return hexoUtil.writePost(_config.hexo, hexoObj, true);
                })
          })
        );
      })
      .then((results) => {
        return Promise.all(
          results.map((newPost) => {
            var oldPost = newPost.match(/.*\/\.__tmp__\.(.*)$/)[1];
            var name = path.basename(oldPost, '.md').split('-').join(' ');
            return pathExists(oldPost)
              .then((exists) => {
                if (!exists){return Promise.resolve({name: name, status:'create'});}
                return fileUtil.readFilePromise(oldPost)
                  .then((oldText) => {
                    return fileUtil.readFilePromise(newPost)
                      .then((newText) => {
                        return {name: name, status: oldText === newText ? 'stable' : 'update'};
                      });
                  })
              });
          })
        );
      })
      .then((results) => {
        results.forEach((result) => {
          var head = '';
          switch(result.status) {
            case 'create' : head = clct.error('CREATE');break;
            case 'update': head = clct.success('UPDATE');break;
            case 'stable': head = clct.notice('STABLE');break;
          }
          console.log(`[${head}] ${result.name}`);
        });
      })
      .catch((err) => {
        onError(err);
      });
  });

function loadConfig() {
  return pathExists(CONFIG_FILE_PATH)
    .then((result) => {
      if (!result) {
        return Promise.reject(`Config file is not found. Please init > ${clct.script('$ quihex init')}`);
      }
      return fileUtil.readJsonFilePromise(CONFIG_FILE_PATH);
    });
}

function fetchConfig() {
  return pathExists(CONFIG_FILE_PATH)
    .then((exists) => {
      if (!exists) {
        return Promise.reject('config file is not found');
      }
      return fileUtil.readJsonFilePromise(CONFIG_FILE_PATH);
    })
    .then((result) => {
      return Promise.resolve({exists: true, config: result});
    })
    .catch((err) => {
      return Promise.resolve({exists: false, config: {}});
    })
    ;
}

function createConfig(hexoPath, quiverLibPath, syncNotebook) {
  var configObj = {
    hexo: hexoPath,
    quiver: quiverLibPath,
    syncNotebook: syncNotebook,
    tagsForNotSync: [
      'hide', 'wip', 'secret'
    ]
  };

  return new Promise((resolve, reject) => {
    jsonfile.writeFile(CONFIG_FILE_PATH, configObj, {spaces: 2}, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function isValidHexoDir(hexoPath) {
  var hexoConfigPath = path.join(hexoPath, '_config.yml');

  return pathExists(hexoPath)
    .then((exists) => {
      if (!exists) {
        return Promise.reject();
      }
      return pathExists(hexoConfigPath);
    })
    .then((exists) => {
      if (!exists) {
        return Promise.reject(`Hexo config file is not found [${hexoConfigPath}]`);
      }
      return Promise.resolve();
    });
}

function inputSyncNotebook(current, notebooks) {
  return new Promise((resolve, reject) => {

    var exMsg = current ? '' : _ex(notebooks[0].name);
    var defaultValue = current ? current.name : undefined;

    prompt.start();
    prompt.get(
      [{
        name: 'syncNotebook',
        description: clc.bgBlack.white(`Notebook name for syncing to Hexo ${exMsg}`),
        message: 'Please set the notebook name for sync',
        default: defaultValue,
        type: 'string',
        required: true,
        conform: function (value) {
          return notebooks.map((nb) => {
              return nb.name;
            }).indexOf(value) != -1;
        }
      }], (err, result) => {
        if (err) {
          reject(err);
        }
        if (typeof result === 'undefined') {
          onCancel();
          return;
        }

        var idx = notebooks.map((nb)=> {
          return nb.name;
        }).indexOf(result.syncNotebook);
        resolve(notebooks[idx]);
      }
    );
  });
}


command.parse(process.argv);