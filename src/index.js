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
import expandTilde from 'expand-tilde';
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
    tryLoadConfig()
      .then((config) => {
        if (config.exists) {
          console.log('====================================');
          console.log(`${clct.warning('Warning')}: Already config file exists.`);
          console.log(`${clct.notice('Info')}: If you don't update config, Enter ${clc.bold('empty')} with nothing.`);
          console.log('====================================');
        }

        return inputHexoAndQuiverPath(config.data)
          .then((validAnswers) => {
            return inputSyncNotebookName(validAnswers, config.data)
              .then((syncNotebook) => {
                return createConfig(validAnswers.hexo, validAnswers.quiver, syncNotebook);
              });
          });
      })
      .then(() => {
        console.log('----------------------------------------');
        console.log(`${clct.success('Finished')} :)`);
        console.log(`${clct.notice('Info')}: Config file path is ${clct.script(CONFIG_FILE_PATH)}`);
        console.log('----------------------------------------');
      })
      .catch((err) => {
        onError(err);
      });
  });


command
  .command('ls-notebook')
  .action(() => {
    loadConfig()
      .then((config) => {
        return showUserNotebooks(config.quiver);
      })
      .catch((err) => {
        onError(err);
      });
  });

command
  .command('sync')
  .action(() => {
    loadConfig()
      .then((config) => {
        return getNotebookFilePaths(config)
          .then((notebookPaths) => {
            return convertTempHexoFile(config.hexo, notebookPaths);
          });
      })
      .then((hexoTempFilePaths) => {
        return getBlogStatus(hexoTempFilePaths);
      })
      .then((blogStatus) => {
        blogStatus.forEach((bs) => {
          var _clc = null;
          if (bs.status == 'new') {_clc = clct.error;}
          if (bs.status == 'update') {_clc = clct.success;}
          if (bs.status == 'stable') {_clc = clct.notice;}
          console.log(_clc(bs.status.toUpperCase()) + " " + bs.name)
        });
      })
      .catch((err) => {
        onError(err);
      });
  });

function inputHexoAndQuiverPath(config) {

  var hexoEx = _ex('/Users/you/hexo-blog');
  var qvLibEx = _ex('/Users/you/Library/Quiver.qvlibrary');

  // TODO impl(maybe need sync process)
  var confirmFuncForHexo = (inputValue) => {
    return true;
  };
  var confirmFuncForQuiver = (inputValue) => {
    return true;
  }

  var questions = [
    {
      name: 'hexo',
      description: clct.question(`${clc.bold('Hexo')} root dir path ${config ? '' : hexoEx}`),
      default: config ? config.hexo : undefined,
      message: 'Please input hexo root path. Not found the path or need files.',
      type: 'string',
      required: true,
      conform: confirmFuncForHexo
    },
    {
      name: 'quiver',
      description: clct.question(`${clc.bold('Quiver')} library path ${config ? '' : qvLibEx}`),
      default: config ? config.quiver : undefined,
      type: 'string',
      required: true,
      conform: confirmFuncForQuiver
    }
  ];

  return new Promise((resolve, reject) => {
    prompt.start();
    prompt.get(questions, (err, answers) => {

      if (typeof answers === 'undefined') {
        onCancel();
        return;
      }
      resolve(answers);
    });
  })
    .then((answers) => {
      // FIXME valid check when user inputs value.
      return isValidHexoAndQuiverPath(answers.hexo, answers.quiver);
    });
}

function isValidHexoAndQuiverPath(hexoPath, quiverLibPath) {
  return isValidHexoDir(hexoPath)
    .then(() => {
      return quiverUtil.isValidQuiverLib(quiverLibPath)
    })
    .then((valid) => {
      if (!valid) {
        return Promise.reject(new Error(`Quiver lib file path is invalid [${quiverLibPath}]`));
      }
      return Promise.resolve({hexo: expandTilde(hexoPath), quiver: expandTilde(quiverLibPath)});
    })
}


function loadConfig() {
  return pathExists(CONFIG_FILE_PATH)
    .then((result) => {
      if (!result) {
        return Promise.reject(`Config file is not found. Please init > ${clct.script('$ quihex init')}`);
      }
      return fileUtil.readJsonFilePromise(CONFIG_FILE_PATH);
    });
}

function tryLoadConfig() {
  return loadConfig()
    .then((config) => {
      return Promise.resolve({exists: true, data: config});
    })
    .catch(() => {
      return Promise.resolve({exists: false, data: null});
    });
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
  var expandPath = expandTilde(hexoPath);
  var hexoConfigPath = path.join(expandPath, '_config.yml');

  return pathExists(expandPath)
    .then((exists) => {
      if (!exists) {
        return Promise.reject(new Error(`Not found hexo path [${hexoPath}]`));
      }
      return pathExists(expandTilde(hexoConfigPath));
    })
    .then((exists) => {
      if (!exists) {
        return Promise.reject(`Hexo config file is not found [${hexoConfigPath}]`);
      }

      return Promise.resolve();
    });
}

function showUserNotebooks(quiver) {
  return quiverUtil.getAllNotebooksMeta(quiver)
    .then((notebooks) => {
      if (notebooks.length === 0) {
        return Promise.reject(new Error('Please create one or more your notebooks.'));
      }
      console.log('-----------------');
      console.log(' Found Notebooks ');
      console.log('-----------------');

      notebooks.map((nb) => {
        console.log(`📓  ${nb.name}`);
      });
      return Promise.resolve(notebooks);
    });
}

function getNotebookFilePaths(config) {
  return quiverUtil.getNotebookPath(config)
    .then((notebookPath) => {
      return fileUtil.getChildrenFilePaths(notebookPath);
    })
    .then((paths) => {
      return Promise.resolve(
        paths.filter((filepath) => {
          return path.extname(filepath) === '.qvnote'
        }));
    });
}

function convertTempHexoFile(hexoRootPath, notebookPaths) {
  return Promise.all(
    notebookPaths.map((notepath) => {
      return quiverUtil.loadNoteFile(notepath)
        .then((note) => {
          return quiverUtil.convertToHexoObj(note);
        })
        .then((hexoObj) => {
          return hexoUtil.writePost(hexoRootPath, hexoObj, true);
        })
    }));
}

function getBlogStatus(hexoTempFilePaths) {
  return Promise.all(
    hexoTempFilePaths.map((newPost) => {
      var oldPost = newPost.match(/^(.*\/)\.__tmp__\.(.*)$/).slice(1, 3).join('');
      var name = path.basename(oldPost, '.md').split('-').join(' ');
      return pathExists(oldPost)
        .then((exists) => {
          var obj = {name: name};
          if (!exists) {
            obj.status = 'new';
            return Promise.resolve(obj);
          }
          return Promise.all(
            [fileUtil.readFilePromise(oldPost), fileUtil.readFilePromise(newPost)]
            )
            .then((results) => {
              obj.status = results[0] === results[1] ? 'stable' : 'update';
              return Promise.resolve(obj)
            });
        })
    }));
}

function inputSyncNotebookName(answers, config) {
  return showUserNotebooks(answers.quiver)
    .then((notebooks) => {
      var inputExample = _ex(notebooks[0].name);

      var confirmFunc = (inputName) => {
        return notebooks.map((notebook) => {
            return notebook.name;
          }).indexOf(inputName) != -1;
      };

      var question = [{
        name: 'syncNotebook',
        description: clct.question(`Notebook name for syncing to Hexo ${config ? '' : inputExample}`),
        message: 'Please set the notebook name for sync',
        default: config ? config.syncNotebook.name : undefined,
        type: 'string',
        required: true,
        conform: confirmFunc
      }];

      return new Promise((resolve, reject) => {
        prompt.start();
        prompt.get(question, (err, result) => {
          if (err) {
            reject(err);
          }
          if (typeof result === 'undefined') {
            onCancel();
            return;
          }

          // return selected notebook
          var selectedIdx = notebooks.map((nb)=> {
            return nb.name;
          }).indexOf(result.syncNotebook);
          resolve(notebooks[selectedIdx]);
        });
      });
    });
}


command.parse(process.argv);