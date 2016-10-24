import assert from 'power-assert';

import path from 'path';
import del from 'del';
import mkdir from 'mkdirp';
import fs from 'fs';
import pathExists from 'path-exists';
import getHomePath from 'home-path';

import fileUtil from '../src/utils/file-util';
import qconfig from '../src/quihex-config';

function getConfigJsonStr() {
  return '{"quiver":"quiver-path","hexo":"hexo-path","syncNotebook":{"name":"Blog","uuid":"UUID-EXAMPLE"},"tagsForSync":["test","tag","yes"]}';
}

const TEST_CONFIG_OBJ = {"quiver":"quiver-path","hexo":"hexo-path","syncNotebook":{"name":"Blog","uuid":"UUID-EXAMPLE"},"tagsForSync":["test","tag","yes"]};

function stubGetConfigFilePath(path) {
  qconfig.__Rewire__('getConfigFilePath', () => path)
}
function restoreGetConfigFilePath() {
  qconfig.__ResetDependency__('getConfigFilePath');
}

function stubExistsConfigFile(result) {
  qconfig.__Rewire__('_existsConfigFile', () => Promise.resolve(result))
}

function restoreExistsConfigFile() {
  qconfig.__ResetDependency__('_existsConfigFile');
}

function stubReadJsonConfigFile(json) {
  qconfig.__Rewire__('_readJsonConfigFile', () => Promise.resolve(json))
}
function restoreReadJsonConfigFile() {
  qconfig.__ResetDependency__('_readJsonConfigFile');
}

describe('QuihexConfig', () => {
  before(() => {
    stubGetConfigFilePath('.tmp/.quihexrc');
  });
  after(() => {
    restoreGetConfigFilePath();
  });

  describe('loadConfigUnsafety(config)', () => {
    context('when quihex config file is not found', () => {
      before(() => {
        stubExistsConfigFile(false);
      });
      it('should catch error', () => {
        return qconfig.loadConfigUnsafety()
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'Config file is not found. Please init > \'$ quihex init\'');
          });
      });
      after(() => {
        restoreExistsConfigFile();
      });
    });
    context('when broken quihex config file is found', () => {
      before(() => {
        stubExistsConfigFile(true);
        stubReadJsonConfigFile({});
      });
      after(() => {
        restoreExistsConfigFile();
        restoreReadJsonConfigFile();
      });
      it('should get broken config', () => {
        var obj = JSON.parse(getConfigJsonStr());
        return qconfig.loadConfigUnsafety(obj)
          .then((config) => {
            assert(typeof config.hexo === 'undefined');
            assert(typeof config.quiver === 'undefined');
            assert(typeof config.syncNotebook === 'undefined');
            assert(typeof config.tagsForSync ==='undefined');
          });
      });
    });

  });

  describe('loadValidatedConfig()', () => {
    context('when quihex config file is not found', () => {
      before(() => {
        stubExistsConfigFile(false);
      });
      after(() => {
        restoreExistsConfigFile();
      });
      it('should catch error', () => {
        return qconfig.loadValidatedConfig()
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'Config file is not found. Please init > \'$ quihex init\'');
          });
      });
    });

    context('when quihex config file has all require fields', () => {
      before(() => {
        stubExistsConfigFile(true);
        stubReadJsonConfigFile(TEST_CONFIG_OBJ);
      });
      after(() => {
        restoreExistsConfigFile();
        restoreReadJsonConfigFile();
      });
      it('should be valid', () => {
        return qconfig.loadValidatedConfig()
          .then((config) => {
            assert(config.getHexoRootPath() === TEST_CONFIG_OBJ.hexo);
            assert(config.getQuiverLibPath() === TEST_CONFIG_OBJ.quiver);
            assert(config.getSyncNotebookName() === TEST_CONFIG_OBJ.syncNotebook.name);
            assert(config.getSyncNotebookUUID() === TEST_CONFIG_OBJ.syncNotebook.uuid);
            assert(config.getTagsForSync() === TEST_CONFIG_OBJ.tagsForSync);
          });
      });
    });

    context('when quihex config file has', () => {
      before(() => {
        stubExistsConfigFile(true);
        var conf = Object.assign({}, TEST_CONFIG_OBJ, {tagsForNotSync: {}});
        stubReadJsonConfigFile(conf);
      });
      after(() => {
        restoreExistsConfigFile();
        restoreReadJsonConfigFile();
      });
      context('tagsForNotSync', () => {
        it('should throw error about disable conf', () => {
          return qconfig.loadValidatedConfig()
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === `Sorry, \'tagsForNotSync\' config is no longer enabled config. Please use \'tagsForSync\' for sync quiver posts. Try re-initialize > '$ quihex init'.`);
            });
        });
      });
    });

    context('when quihex config file dose not have', () => {
      before(() => {
        stubExistsConfigFile(true);
      });
      after(() => {
        restoreExistsConfigFile();
      });

      function _assertError() {
        return qconfig.loadValidatedConfig()
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'Config file is broken. Please remove config file > \'$ rm .tmp/.quihexrc\', and re-init > \'$ quihex init\'');
          })
      }

      context('hexo field', () => {
        before(() => {
          stubReadJsonConfigFile(Object.assign({}, TEST_CONFIG_OBJ, {hexo:undefined}));
        });
        after(() => {
          restoreReadJsonConfigFile();
        });
        it('should be invalid', () => {
          return _assertError();
        });
      });
      context('quiver field', () => {
        before(() => {
          stubReadJsonConfigFile(Object.assign({}, TEST_CONFIG_OBJ, {quiver:undefined}));
        });
        after(() => {
          restoreReadJsonConfigFile();
        });
        it('should be invalid', () => {
          return _assertError();
        });
      });
      context('syncNotebook field', () => {
        before(() => {
          stubReadJsonConfigFile(Object.assign({}, TEST_CONFIG_OBJ, {syncNoteBook:undefined}));
        });
        after(() => {
          restoreReadJsonConfigFile();
        });
        it('should be invalid', () => {
          return _assertError();
        });
      });
      context('syncNotebook.name field', () => {
        before(() => {
          stubReadJsonConfigFile(Object.assign({}, TEST_CONFIG_OBJ, {syncNotebook:{}}));
        });
        after(() => {
          restoreReadJsonConfigFile();
        });
        it('should be invalid', () => {
          return _assertError();
        });
      });
      context('syncNotebook.uuid field', () => {
        before(() => {
          stubReadJsonConfigFile(Object.assign({}, TEST_CONFIG_OBJ, {syncNotebook:{}}));
        });
        after(() => {
          restoreReadJsonConfigFile();
        });
        it('should be invalid', () => {
          return _assertError();
        });
      });
      context('tagsForSync field', () => {
        before(() => {
          stubReadJsonConfigFile(Object.assign({}, TEST_CONFIG_OBJ, {tagsFprSync:undefined}));
        });
        after(() => {
          restoreReadJsonConfigFile();
        });
        it('should be invalid', () => {
          return _assertError();
        });
      });
    });
  });

  describe('createConfigObj(quiverLibPath, hexoRootPath, syncNotebook)', () => {
    context('when input valid values', () => {
      it('create config obj', () => {
        var obj = qconfig.createConfigObj('qlibpath', 'hexorootpath', {name:'testname', uuid:'testuuid'}, ['sync','tag']);
        assert(obj.quiver === 'qlibpath');
        assert(obj.hexo === 'hexorootpath');
        assert(obj.syncNotebook.name === 'testname');
        assert(obj.syncNotebook.uuid === 'testuuid');
        assert(obj.tagsForSync.length === 2);
        assert(obj.tagsForSync[0] === 'sync');
        assert(obj.tagsForSync[1] === 'tag');
      });
    });
  });

  describe('writeConfig(configObj)', () => {
    context('when config obj is valid', () => {
      before(() => {
        mkdir.sync('.tmp');
      });
      after(() => {
        del.sync('.tmp');
      });
      it('should write file', () => {
        var obj = {sample: true};
        return qconfig.writeConfig(obj)
          .then(() => {
            return pathExists('.tmp/.quihexrc');
          })
          .then((exists) => {
            assert(exists === true);
            return fileUtil.readJsonFilePromise('.tmp/.quihexrc');
          })
          .then((obj) => {
            assert(obj.sample === true);
          });
      });
    });
  });

  describe('getConfig', () => {
    before(() => {
      stubExistsConfigFile(true);
      qconfig.__set__('_loadedConfig', null);
    });
    after(() => {
      restoreExistsConfigFile();
    });
    context('when call this method before loading config file', () => {
      it('should get null', () => {
        assert(qconfig.getConfig() === null);
      });
    });

    context('when validation config file is loaded', () => {
      before(() => {
        stubReadJsonConfigFile(TEST_CONFIG_OBJ);
      });
      after(() => {
        restoreReadJsonConfigFile();
      });
      it('should get loaded config data', () => {
        return qconfig.loadValidatedConfig()
          .then(() => {
            let config = qconfig.getConfig();
            assert(config.getHexoRootPath() === TEST_CONFIG_OBJ.hexo);
            assert(config.getQuiverLibPath() === TEST_CONFIG_OBJ.quiver);
            assert(config.getSyncNotebookName() === TEST_CONFIG_OBJ.syncNotebook.name);
            assert(config.getSyncNotebookUUID() === TEST_CONFIG_OBJ.syncNotebook.uuid);
            assert(config.getTagsForSync() === TEST_CONFIG_OBJ.tagsForSync);
          });
      });
    });
    context('when unsafety config file is loaded', () => {
      before(() => {
        stubReadJsonConfigFile({});
      });
      after(() => {
        restoreReadJsonConfigFile();
      });
      it('should get loaded config data', () => {
        return qconfig.loadConfigUnsafety()
          .then(() => {
            let config = qconfig.getConfig();
            assert(config.getHexoRootPath() === null);
            assert(config.getQuiverLibPath() === null);
            assert(config.getSyncNotebookName() === null);
            assert(config.getSyncNotebookUUID() === null);
            assert(config.getTagsForSync() === null);
          });
      });
    });
    context('when it is failed to load config file after success to load', () => {
      before(() => {
        stubReadJsonConfigFile(TEST_CONFIG_OBJ);
      });
      after(() => {
        restoreReadJsonConfigFile();
      });
      it('should reset loaded config data', () => {
        return qconfig.loadValidatedConfig()
          .then(() => {
            stubReadJsonConfigFile({invalid: 'json'});
            return qconfig.loadValidatedConfig();
          })
          .catch(() => {
            assert(qconfig.getConfig() === null);
          });
      });
    });
  })
});
