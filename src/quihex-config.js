import path from 'path';
import getHomePath from 'home-path';
import pathExists from 'path-exists';
import jsonFile from 'jsonfile';

import fileUtil from './utils/file-util'

class QuihexConfig {

  loadValidatedConfig() {
    return this._loadConfig(true);
  }

  /**
   * WARNING: it is not to validate config file
   */
  loadConfigUnsafety() {
    return this._loadConfig(false);
  }

  createConfigObj(quiverLibPath, hexoRootPath, syncNotebook, tagsForSync) {
    return {
      quiver: quiverLibPath,
      hexo: hexoRootPath,
      syncNotebook,
      tagsForSync
    };
  }

  writeConfig(configObj) {
    return new Promise((resolve, reject) => {
      jsonFile.writeFile(this._getConfigFilePath(), configObj, {spaces: 2}, (err) => {
        if (err) {
          reject(err);
        }
        resolve(configObj);
      });
    });
  }


  _validQuihexConfig(config) {
    return new Promise((resolve, reject) => {
      if (typeof config.tagsForNotSync !== 'undefined') {
        reject(new Error(`Sorry, \'tagsForNotSync\' config is no longer enabled config. Please use \'tagsForSync\' for sync quiver posts. Try re-initialize > '$ quihex init'.`));
      }

      if (
        typeof config === 'undefined' ||
        typeof config.hexo === 'undefined' ||
        typeof config.quiver === 'undefined' ||
        typeof config.syncNotebook === 'undefined' ||
        typeof config.syncNotebook.name === 'undefined' ||
        typeof config.syncNotebook.uuid === 'undefined' ||
        typeof config.tagsForSync === 'undefined'
      ) {
        reject(new Error(`Config file is broken. Please remove config file > '$ rm ${this._getConfigFilePath()}', and re-init > '$ quihex init'`));
      }

      resolve(config);
    })
  }

  _loadConfig(validate = true) {
    return this._existsConfigFile()
      .then((result) => {
        if (!result) {
          return Promise.reject(new Error(`Config file is not found. Please init > '$ quihex init'`));
        }
        return this._readJsonConfigFile();
      })
      .then((config) => {
        return validate ? this._validQuihexConfig(config) : Promise.resolve(config);
      });
  }

  _getConfigFilePath() {
    return path.join(getHomePath(), '.quihexrc');
  }

  _existsConfigFile() {
    return pathExists(this._getConfigFilePath());
  }

  _readJsonConfigFile() {
    return fileUtil.readJsonFilePromise(this._getConfigFilePath());
  }
}


export default new QuihexConfig();
