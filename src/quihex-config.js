import path from 'path';
import getHomePath from 'home-path';
import pathExists from 'path-exists';
import jsonFile from 'jsonfile';

import fileUtil from './utils/file-util'

class QuihexConfig {

  getConfigFilePath() {
    return path.join(getHomePath(), '.quihexrc');
  }

  _validQuihexConfig(config) {
    return new Promise((resolve, reject) => {
      if (
        typeof config === 'undefined' ||
        typeof config.hexo === 'undefined' ||
        typeof config.quiver === 'undefined' ||
        typeof config.syncNotebook === 'undefined' ||
        typeof config.syncNotebook.name === 'undefined' ||
        typeof config.syncNotebook.uuid === 'undefined' ||
        typeof config.tagsForNotSync === 'undefined'
      ) {
        reject(new Error(`Config file is broken. Please remove config file > '$ rm ${this.getConfigFilePath()}', and re-init > '$ quihex init'`))
      }
      resolve(config);
    })
  }

  loadConfig() {
    return pathExists(this.getConfigFilePath())
      .then((result) => {
        if (!result) {
          return Promise.reject(new Error(`Config file is not found. Please init > '$ quihex init'`));
        }
        return fileUtil.readJsonFilePromise(this.getConfigFilePath());
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
      jsonFile.writeFile(this.getConfigFilePath(), configObj, {spaces: 2}, (err) => {
        if (err) {reject(err);}
        resolve();
      });
    });
  }

}

export default new QuihexConfig();