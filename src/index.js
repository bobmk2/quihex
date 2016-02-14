#!/usr/bin/env node

'use strict';
import command from 'commander';
import clc from 'cli-color';
import prompt from 'prompt';
import jsonfile from 'jsonfile';
import pathExists from 'path-exists';
import path from 'path';
import getHomePath from 'home-path';
import fs from 'fs';

const APP_NAME = 'quihex';
const CONFIG_FILE_PATH = path.join(getHomePath(), '.quihexrc');

const _success = clc.green;
const _error = clc.red.bold;
const _notice = clc.blue;
const _script = clc.bgBlack.xterm(10);

prompt.message = `${_notice('Input')}`;
prompt.delimiter = `${clc.white(': ')}`;

function onCancel() {
  console.log('------');
  console.log(_notice('Cancel'));
  console.log('------');
}

command
  .command('ls-notebook')
  .action( () => {
    loadConfig()
      .then( (config) => {
        return new Promise( (resolve, reject) => {
          fs.readdir(config.quiver, (err, files) => {
            if (err) {
              reject(err);
            }
            resolve({config:config, files:files});
          })
        });
      })
      .then( (result) => {
        return Promise.all(
          result.files.map( (file) => {
            return loadNotebookMeta(result.config.quiver, file);
          })
        );
      })
      .then( (result) => {
        result.filter( (file) => {
          return file.name != 'Inbox' && file.name != 'Trash';
        }).map( (file) => {
          console.log(`📓  ${file.name}`);
        });
      })
      .catch( (err) => {
        console.log(`${_error('Error')}: ${err}`);
      });
  });

command
  .command('init')
  .action( () => {

    prompt.start();
    prompt.get([
      {
        name: 'hexoPath',
        description: clc.bgBlack.white(`${clc.bold('Hexo')} root dir path (ex. /Users/you/hexo-blog)`)
      },
      {
        name: 'quiverLibPath',
        description: clc.bgBlack.white(`${clc.bold('Quiver')} library path (ex. /Users/you/Library/Quiver.qvlibrary )`)
      }], (err, result) => {

      if (typeof result === 'undefined') {
        onCancel();
        return;
      }

      var hexoPath = result.hexoPath;
      var quiverLibPath = result.quiverLibPath;

      isValidHexoDir(hexoPath)
        .then( function () {
          return isValidQuiverLibraryFile(quiverLibPath)
        })
        .then( function () {
          return createConfig(hexoPath, quiverLibPath);
        })
        .then( function () {
          console.log('------------------------')
          console.log(_success('Finished'));
          console.log(`Change config later > ${_script(`$ vim ~/.quihexrc`)}`);
          console.log('------------------------')
        })
        .catch( function (err) {
          console.log(`${_error('Error')}: ${err}`);
        });


    });
  });

function loadNotebookMeta(qvLibRoot, qvnoteFileName) {
  return new Promise((resolve, reject) => {
    jsonfile.readFile(path.join(qvLibRoot, qvnoteFileName, 'meta.json'), (err, obj) => {
      if (err) {
        reject(err);
      }
      resolve(obj);
    });
  });
}

function loadConfig() {
  return pathExists(CONFIG_FILE_PATH)
    .then( (result) => {
      if (!result){
        return Promise.reject(`Config file is not found. Please init > ${_script('$ quihex init')}`);
      }
      return new Promise( (resolve, reject) => {
        jsonfile.readFile(CONFIG_FILE_PATH, (err, obj) => {
          if (err) {
            reject(err);
          }
          resolve(obj);
        });
      });
    });
}

function createConfig(hexoPath, quiverLibPath) {
  var configObj = {
    hexo: hexoPath,
    quiver: quiverLibPath,
    tagsForNotSync: [
      'hide', 'wip', 'secret'
    ]
  };

  return new Promise( function (resolve, reject) {
    jsonfile.writeFile( CONFIG_FILE_PATH, configObj, {spaces: 2}, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function isValidHexoDir(hexoPath){
  var hexoConfigPath = path.join(hexoPath, '_config.yml');

  return pathExists(hexoPath)
    .then( function (exists) {
      if (!exists) {
        return Promise.reject(`the haxo dir is not found [${hexoPath}]`);
      }
      return pathExists(hexoConfigPath);
    })
    .then( function (exists) {
      if (!exists) {
        return Promise.reject(`Hexo config file is not found [${hexoConfigPath}]`);
      }
      return Promise.resolve();
    });
}

function isValidQuiverLibraryFile(qvLibPath){
  var trashNotebook = path.join(qvLibPath, 'Trash.qvnotebook');

  return pathExists(qvLibPath)
    .then( function (exists) {
      if (!exists) {
        return Promise.reject(`the quiver lib file is not found [${qvLibPath}]`);
      }
      return pathExists(trashNotebook);
    })
    .then( function (exists) {
      if (!exists) {
        return Promise.reject(`This will be not Quiver Library File [${qvLibPath}]`);
      }
      return Promise.resolve();
    });
}


command.parse(process.argv);