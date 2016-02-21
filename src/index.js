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
        return getUserNotebookNames(config.quiver);
      })
      .then((notebookNames) => {
        notebookNames.map((nb) => {
          console.log(`📓  ${nb.name}`);
        });
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
            return getAllBlogStatus(config, notebookPaths);
          });
      })
      .then((results) => {
        // FIXME
        results.forEach((result) => {
          var _clc = clct.warning;
          if (result.status == 'new') {
            _clc = clct.error;
          }
          if (result.status == 'update') {
            _clc = clct.success;
          }
          if (result.status == 'stable') {
            _clc = clct.notice;
          }
          console.log(_clc(result.status.toUpperCase()) + " " + result.hexoObj.filename)
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
  };

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
      return validCheckHexoAndQuiverPath(answers.hexo, answers.quiver);
    });
}

function validCheckHexoAndQuiverPath(hexoPath, quiverLibPath) {
  return isValidHexoDir(hexoPath)
    .then(() => {
      return quiverUtil.validQuiverLib(quiverLibPath)
    })
    .then(() => {
      return Promise.resolve({hexo: expandTilde(hexoPath), quiver: expandTilde(quiverLibPath)});
    })
}


function loadConfig() {
  return pathExists(CONFIG_FILE_PATH)
    .then((result) => {
      if (!result) {
        return Promise.reject(new Error(`Config file is not found. Please init > ${clct.script('$ quihex init')}`));
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

function getUserNotebookNames(quiver) {
  return quiverUtil.getAllNotebooksMeta(quiver)
    .then((notebooks) => {
      if (notebooks.length === 0) {
        return Promise.reject(new Error('Please create one or more your notebooks.'));
      }
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

function getAllBlogStatus(config, notebookPaths) {
  return Promise.all(
    notebookPaths.map((path) => {
      return quiverUtil.loadNoteFile(path)
        .then((notebook) => {
          return quiverUtil.convertToHexoObj(notebook)
        })
        .then((hexoObj) => {
          return getBlogStatus(config, hexoObj)
        })
    })
  );
}

function getBlogStatus(config, hexoObj) {
  return hexoUtil.getHexoConfig(config.hexo)
    .then((hexoConfig) => {

      var postsRoot = path.join(config.hexo, hexoConfig.source_dir, '_posts');
      var lastFilePath = path.join(postsRoot, `${hexoObj.filename}.md`);
      var tempFilePath = path.join(postsRoot, `.__tmp__.${hexoObj.filename}.md`);

      var createStatus = (status) => {
        return {
          hexoObj: hexoObj,
          status: status
        }
      }

      // if quihex note has not sync tag, skip sync it.
      if (hexoObj.tags.filter((tag) => {
        return (config.tagsForNotSync.indexOf(tag) !== -1);
      }).length > 0) {
        return Promise.resolve(createStatus('skip'));
      }

      return pathExists(lastFilePath)
        .then((exists) => {
          if (!exists) {
            return Promise.resolve(createStatus('new'));
          }
          return hexoUtil.writePost(hexoObj, tempFilePath)
            .then(() => {
              return isEqualTextOfTwoFiles(lastFilePath, tempFilePath)
            })
            .then((isEqual) => {
              return Promise.resolve(createStatus(isEqual ? 'stable' : 'update'));
            });
        })
    });
}

function isEqualTextOfTwoFiles(firstFilePath, secondFilePath) {
  return Promise.all(
    [fileUtil.readFilePromise(firstFilePath), fileUtil.readFilePromise(secondFilePath)]
    )
    .then((results) => {
      return Promise.resolve(results[0] === results[1]);
    });
}

function inputSyncNotebookName(answers, config) {
  return getUserNotebookNames(answers.quiver)
    .then((notebookNames) => {
      console.log('-----------------');
      console.log(' Found Notebooks ');
      console.log('-----------------');

      notebookNames.map((nb) => {
        console.log(`📓  ${nb.name}`);
      });

      var inputExample = _ex(notebookNames[0].name);

      var conformFunc = (inputName) => {
        return notebookNames.map((notebook) => {
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
        conform: conformFunc
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
          var selectedIdx = notebookNames.map((nb)=> {
            return nb.name;
          }).indexOf(result.syncNotebook);
          resolve(notebookNames[selectedIdx]);
        });
      });
    });
}


command.parse(process.argv);