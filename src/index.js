#!/usr/bin/env node

'use strict';
import command from 'commander';
import clc from 'cli-color';
import clct from './utils/cli-color-template';
import fileUtil from './utils/file-util';
import prompt from 'prompt';
import jsonfile from 'jsonfile';
import pathExists from 'path-exists';
import path from 'path';
import getHomePath from 'home-path';
import fs from 'fs';

const APP_NAME = 'quihex';
const CONFIG_FILE_PATH = path.join(getHomePath(), '.quihexrc');

const _ex = (msg) => { return clct.example(`(ex. ${msg})`); };

prompt.message = `${clct.notice('Input')}`;
prompt.delimiter = `${clc.white(': ')}`;

function onCancel() {
  console.log('\r\n--------');
  console.log(clct.notice('Canceled'));
  console.log('--------');
}

function onError(errMsg) {
  console.log(`${clct.error('Error')}: ${errMsg}`);
}

command
  .command('init')
  .action( () => {

    fetchConfig().then( (result) => {
      if (result.exists) {
        console.log('====================================');
        console.log(`${clct.warning('Warning')}: Already exists config file.`);
        console.log(`${clct.notice('Tips')}: If you don't update config, Enter ${clc.bold('empty')} with doing nothing.`);
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
          .then( () => {
            return isValidQuiverLibraryFile(quiverLibPath)
          })
          .then( () => {
            return fetchNotebookMetaList(quiverLibPath);
          })
          .then( (result) => {
            console.log('----------');
            console.log('   Name   ');
            console.log('----------');
            result.map( (file) => {
              console.log(`📓  ${file.name}`);
            });
            return inputSyncNotebook(config.syncNotebook, result);
          })
          .then( (syncNotebook) => {
            return createConfig(hexoPath, quiverLibPath, syncNotebook);
          })
          .then( () => {
            console.log('------------------------')
            console.log(clct.success('Finished'));
            console.log(`Change config later > ${clct.script(`$ vim ~/.quihexrc`)}`);
            console.log('------------------------')
          })
          .catch( (err) => {
            onError(err);
          });
      });
    }).catch( (err) => {
        onError(err);
      })
  });

command
  .command('ls-notebook')
  .action( () => {
    loadConfig()
      .then( (config) => {
        return fetchNotebookMetaList(config.quiver);
      })
      .then( (result) => {
        result.map( (file) => {
          console.log(`📓  ${file.name}`);
        });
      })
      .catch( (err) => {
        onError(err);
      });
  });


function loadNotebookMeta(qvLibRoot, qvnoteFileName) {
  return fileUtil.readJsonFilePromise(path.join(qvLibRoot, qvnoteFileName, 'meta.json'));
}

function loadConfig() {
  return pathExists(CONFIG_FILE_PATH)
    .then( (result) => {
      if (!result){
        return Promise.reject(`Config file is not found. Please init > ${clct.script('$ quihex init')}`);
      }
      return fileUtil.readJsonFilePromise(CONFIG_FILE_PATH);
    });
}

function fetchConfig() {
  return pathExists(CONFIG_FILE_PATH)
    .then( (exists) => {
      if (!exists) {
        return Promise.reject('config file is not found');
      }
      return fileUtil.readJsonFilePromise(CONFIG_FILE_PATH);
    })
    .then( (result) => {
      return Promise.resolve({exists:true, config: result});
    })
    .catch( (err) => {
      return Promise.resolve({exists:false, config: {}});
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

  return new Promise( (resolve, reject) => {
    jsonfile.writeFile( CONFIG_FILE_PATH, configObj, {spaces: 2}, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function fetchNotebookMetaList(qvLibPath) {
  return new Promise( (resolve, reject) => {
      fs.readdir(qvLibPath, (err, files) => {
        if (err) {
          reject(err);
        }
        resolve(files);
      })
    })
    .then( (files) => {
      return Promise.all(
        files.filter( (file) => {
          var basename = path.basename(file, '.qvnotebook');
          return basename !== 'Trash' && basename !== 'Inbox';
        }).map( (file) => {
          return loadNotebookMeta(qvLibPath, file);
        })
      );
    })
}

function isValidHexoDir(hexoPath){
  var hexoConfigPath = path.join(hexoPath, '_config.yml');

  return pathExists(hexoPath)
    .then( (exists) => {
      if (!exists) {
        return Promise.reject(`the haxo dir is not found [${hexoPath}]`);
      }
      return pathExists(hexoConfigPath);
    })
    .then( (exists) => {
      if (!exists) {
        return Promise.reject(`Hexo config file is not found [${hexoConfigPath}]`);
      }
      return Promise.resolve();
    });
}

function isValidQuiverLibraryFile(qvLibPath){
  var trashNotebook = path.join(qvLibPath, 'Trash.qvnotebook');

  return pathExists(qvLibPath)
    .then( (exists) => {
      if (!exists) {
        return Promise.reject(`Quiver lib file is not found [${qvLibPath}]`);
      }
      return pathExists(trashNotebook);
    })
    .then( (exists) => {
      if (!exists) {
        return Promise.reject(`This will be not Quiver Library File [${qvLibPath}]`);
      }
      return Promise.resolve();
    });
}

function inputSyncNotebook(current, notebooks) {
  return new Promise( (resolve, reject) => {
    var nbNames = notebooks.map( (nb) => {return nb.name});

    var exMsg = current ? '' : _ex(nbNames[0]);
    var defaultValue = current ? current.name : undefined;

    prompt.start();
    prompt.get(
      [{
        name: 'syncNotebook',
        description: clc.bgBlack.white(`Sync notebook name ${exMsg}`),
        message: 'Please set the notebook name for sync',
        default: defaultValue,
        type: 'string',
        required: true,
        conform: function (value) {
          return nbNames.indexOf(value) != -1;
        }
      }], (err, result) => {
        if (err) {
          reject(err);
        }
        if (typeof result === 'undefined') {
          onCancel();
          return;
        }

        var idx = nbNames.indexOf(result.syncNotebook);
        resolve(notebooks[idx]);
      }
    );
  });
}


command.parse(process.argv);