import path from 'path';
import getHomePath from 'home-path';
import pathExists from 'path-exists';
import jsonFile from 'jsonfile';

import fileUtil from './utils/file-util'

class QuihexConfig {

  constructor(configObj) {
    this._quiverLibPath = typeof configObj.quiver !== 'undefined' && configObj.quiver ? configObj.quiver : null;
    this._hexoRootPath = typeof configObj.hexo !== 'undefined' && configObj.hexo ? configObj.hexo : null;
    this._syncNotebookName = typeof configObj.syncNotebook !== 'undefined' && configObj.syncNotebook ? configObj.syncNotebook.name : null;
    this._syncNotebookUUID = typeof configObj.syncNotebook !== 'undefined' && configObj.syncNotebook ? configObj.syncNotebook.uuid : null;
    this._tagsForSync = typeof configObj.tagsForSync !== 'undefined' && configObj.tagsForSync ? configObj.tagsForSync : null;
  }

  getQuiverLibPath() {
    return this._quiverLibPath;
  }

  getHexoRootPath() {
    return this._hexoRootPath;
  }

  getSyncNotebookName() {
    return this._syncNotebookName;
  }

  getSyncNotebookUUID() {
    return this._syncNotebookUUID;
  }

  getTagsForSync() {
    return this._tagsForSync;
  }
}

function createConfigObj(quiverLibPath, hexoRootPath, syncNotebook, tagsForSync) {
  return {
    quiver: quiverLibPath,
    hexo: hexoRootPath,
    syncNotebook,
    tagsForSync
  };
}

function writeConfig(configObj) {
  return new Promise((resolve, reject) => {
    jsonFile.writeFile(getConfigFilePath(), configObj, {spaces: 2}, (err) => {
      return err ? reject(err) : resolve(configObj);
    });
  });
}

function _validQuihexConfig(configObj) {
  return new Promise((resolve, reject) => {
    if (typeof configObj.tagsForNotSync !== 'undefined') {
      return reject(new Error(`Sorry, \'tagsForNotSync\' config is no longer enabled config. Please use \'tagsForSync\' for sync quiver posts. Try re-initialize > '$ quihex init'.`));
    }

    if (
      typeof configObj === 'undefined' ||
      typeof configObj.hexo === 'undefined' ||
      typeof configObj.quiver === 'undefined' ||
      typeof configObj.syncNotebook === 'undefined' ||
      typeof configObj.syncNotebook.name === 'undefined' ||
      typeof configObj.syncNotebook.uuid === 'undefined' ||
      typeof configObj.tagsForSync === 'undefined'
    ) {
      return reject(new Error(`Config file is broken. Please remove config file > '$ rm ${getConfigFilePath()}', and re-init > '$ quihex init'`));
    }
    return resolve(configObj);
  })
}

function _loadConfig(validate = true) {
  return _existsConfigFile()
    .then((result) => {
      if (!result) {
        return Promise.reject(new Error(`Config file is not found. Please init > '$ quihex init'`));
      }
      return _readJsonConfigFile();
    })
    .then(configObj => {
      var _promise = validate ? _validQuihexConfig(configObj) : Promise.resolve(configObj);
      return _promise.then(configObj => {
        let config = new QuihexConfig(configObj);
        _loadedConfig = config;
        return config;
      })
    })
    .catch(err => {
      _loadedConfig = null;
      return Promise.reject(err);
    });
}

function _existsConfigFile() {
  return pathExists(getConfigFilePath());
}

function _readJsonConfigFile() {
  return fileUtil.readJsonFilePromise(getConfigFilePath());
}

function getConfigFilePath() {
  return path.join(getHomePath(), '.quihexrc');
}

function loadValidatedConfig() {
  return _loadConfig(true);
}

/**
 * WARNING: it is to skip validation of config file
 */
function loadConfigUnsafety() {
  return _loadConfig(false);
}

/**
 * return null when you call this method before loading config file.
 * @returns {QuihexConfig} loaded config file
 */
function getConfig() {
  if (_loadedConfig === null || typeof _loadedConfig === 'undefined') {
    return null;
  }
  return _loadedConfig;
}

var _loadedConfig = null;

export default {
  getConfigFilePath,
  loadValidatedConfig,
  loadConfigUnsafety,
  createConfigObj,
  writeConfig,
  getConfig
}
