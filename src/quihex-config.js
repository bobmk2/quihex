import path from 'path';
import getHomePath from 'home-path';
import pathExists from 'path-exists';
import jsonFile from 'jsonfile';

import fileUtil from './utils/file-util'

const CONFIG_FILE_PATH = path.join(getHomePath(), '.quihexrc');

class QuihexConfig {

  getConfigFilePath() {
    return CONFIG_FILE_PATH;
  }

  _validQuihexConfig(config) {
    return new Promise((resolve, reject) => {
      if (
        typeof config === 'undefined' ||
        typeof config.hexo === 'undefined' ||
        typeof config.quiver === 'undefined' ||
        typeof config.syncNotebook === 'undefined' ||
        typeof config.syncNotebook.name === 'undefined' ||
        typeof config.syncNotebook.uuid === 'undefined') {
        reject(new Error(`Config file is broken. Please remove config file > '$ rm ${CONFIG_FILE_PATH}', and re-init > '$ quihex init'`))
      }
      resolve(config);
    })
  }

  loadConfig() {
    return pathExists(CONFIG_FILE_PATH)
      .then((result) => {
        if (!result) {
          return Promise.reject(new Error(`Config file is not found. Please init > '$ quihex init'`));
        }
        return fileUtil.readJsonFilePromise(CONFIG_FILE_PATH);
      })
      .then((config) => {
        return this._validQuihexConfig(config);
      });
  }

  createConfigObj(quiverLibPath, hexoRootPath, syncNotebook) {
    return {
      quiver: quiverLibPath,
      hexo: hexoRootPath,
      syncNotebook: syncNotebook,
      tagsForNotSync: [
        'hide', 'wip', 'secret'
      ]
    };
  }

  writeConfig(configObj) {
    return new Promise((resolve, reject) => {
      jsonFile.writeFile(CONFIG_FILE_PATH, configObj, {spaces: 2}, (err) => {
        if (err) {reject(err);}
        resolve();
      });
    });
  }

}

export default new QuihexConfig();