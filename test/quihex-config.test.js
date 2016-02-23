import assert from 'power-assert';
import sinon from 'sinon';

import path from 'path';
import del from 'del';
import mkdir from 'mkdirp';
import fs from 'fs';
import pathExists from 'path-exists';
import getHomePath from 'home-path';

import fileUtil from '../src/utils/file-util';
import qconfig from '../src/quihex-config';

function getConfigJsonStr() {
  return '{"quiver":"quiver-path","hexo":"hexo-path","syncNotebook":{"name":"Blog","uuid":"UUID-EXAMPLE"},"tagsForNotSync":["test","tag","yes"]}';
}

describe('QuihexConfig', () => {
  describe('getConfigFilePath()', () => {
    context('when config file path is set', () => {
      before(() => {
        let stub = sinon.stub(path, 'join');
        var homePath = getHomePath();
        stub.withArgs(homePath, '.quihexrc').returns('test-path');
      });
      it('should get config file path', () => {
        var path = qconfig.getConfigFilePath();
        assert(path === 'test-path');
      });
      after(() => {
        path.join.restore();
      });
    });
  });

  describe('loadConfig()', () => {
    context('when quihex config file exists', () => {
      context('and is valid', () => {
        before(() => {
          let stub = sinon.stub(qconfig, 'getConfigFilePath');
          stub.withArgs().returns('.tmp/.quihexrc');
          let stub2 = sinon.stub(qconfig, '_validQuihexConfig');
          stub2.returns(Promise.resolve(JSON.parse(getConfigJsonStr())));

          mkdir.sync('.tmp');
          fs.writeFileSync('.tmp/.quihexrc', getConfigJsonStr(), 'utf8');
        });
        it('should load config', () => {
          return qconfig.loadConfig()
            .then((qconf) => {
              assert(qconf.quiver === 'quiver-path');
              assert(qconf.hexo === 'hexo-path');
              assert(qconf.syncNotebook.name === 'Blog');
              assert(qconf.syncNotebook.uuid === 'UUID-EXAMPLE');
              assert(qconf.tagsForNotSync[0] === 'test');
              assert(qconf.tagsForNotSync[1] === 'tag');
              assert(qconf.tagsForNotSync[2] === 'yes');
            });
        });
        after(() => {
          del.sync('.tmp');
          qconfig.getConfigFilePath.restore();
          qconfig._validQuihexConfig.restore();
        });
      });
      context('and is invalid', () => {
        before(() => {
          let stub = sinon.stub(qconfig, 'getConfigFilePath');
          stub.withArgs().returns('.tmp/.quihexrc');
          let stub2 = sinon.stub(qconfig, '_validQuihexConfig');
          stub2.returns(Promise.reject('local error'));

          mkdir.sync('.tmp');
          fs.writeFileSync('.tmp/.quihexrc', '{"sample":true}', 'utf8');
        });
        it('should load config', () => {
          return qconfig.loadConfig()
            .catch((err) => {
              assert(err === 'local error');
            });
        });
        after(() => {
          del.sync('.tmp');
          qconfig.getConfigFilePath.restore();
          qconfig._validQuihexConfig.restore();
        });
      });
    });

    context('when quihex config file is not found', () => {
      before(() => {
        let stub = sinon.stub(qconfig, 'getConfigFilePath');
        stub.withArgs().returns('.tmp/.quihexrc');
      });
      it('should catch error', () => {
        return qconfig.loadConfig()
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'Config file is not found. Please init > \'$ quihex init\'');
          });
      });
      after(() => {
        qconfig.getConfigFilePath.restore();
      });
    });

  });

  describe('_validQuihexConfig(config)', () => {
    context('when quihex config file has all require fields', () => {
      before(() => {
        mkdir.sync('.tmp');
        fs.writeFileSync('.tmp/.quihexrc', getConfigJsonStr(), 'utf8');
      });
      it('should be valid', () => {
        var obj = JSON.parse(getConfigJsonStr());
        return qconfig._validQuihexConfig(obj)
          .then((config) => {
            assert(config.hexo === obj.hexo);
            assert(config.quiver === obj.quiver);
            assert(config.syncNotebook.name === obj.syncNotebook.name);
            assert(config.syncNotebook.uuid === obj.syncNotebook.uuid);
            assert(config.tagsForNotSync === obj.tagsForNotSync);
          });
      });
      after(() => {
        del.sync('.tmp');
      });
    });

    context('when quihex config file dose not have', () => {
      before(() => {
        let stub = sinon.stub(qconfig, 'getConfigFilePath');
        stub.withArgs().returns('.tmp/.quihexrc');
      });
      context('hexo field', () => {
        it('should be invalid', () => {
          var json = JSON.parse(getConfigJsonStr());
          delete json.hexo;
          return qconfig._validQuihexConfig(json)
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Config file is broken. Please remove config file > \'$ rm .tmp/.quihexrc\', and re-init > \'$ quihex init\'');
            });
        });
      });
      context('quiver field', () => {
        it('should be invalid', () => {
          var json = JSON.parse(getConfigJsonStr());
          delete json.quiver;
          return qconfig._validQuihexConfig(json)
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Config file is broken. Please remove config file > \'$ rm .tmp/.quihexrc\', and re-init > \'$ quihex init\'');
            });
        });
      });
      context('syncNotebook field', () => {
        it('should be invalid', () => {
          var json = JSON.parse(getConfigJsonStr());
          delete json.syncNotebook;
          return qconfig._validQuihexConfig(json)
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Config file is broken. Please remove config file > \'$ rm .tmp/.quihexrc\', and re-init > \'$ quihex init\'');
            });
        });
      });
      context('syncNotebook.name field', () => {
        it('should be invalid', () => {
          var json = JSON.parse(getConfigJsonStr());
          delete json.syncNotebook.name;
          return qconfig._validQuihexConfig(json)
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Config file is broken. Please remove config file > \'$ rm .tmp/.quihexrc\', and re-init > \'$ quihex init\'');
            });
        });
      });
      context('syncNotebook.uuid field', () => {
        it('should be invalid', () => {
          var json = JSON.parse(getConfigJsonStr());
          delete json.syncNotebook.uuid;
          return qconfig._validQuihexConfig(json)
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Config file is broken. Please remove config file > \'$ rm .tmp/.quihexrc\', and re-init > \'$ quihex init\'');
            });
        });
      });
      context('tagsForNotSync field', () => {
        it('should be invalid', () => {
          var json = JSON.parse(getConfigJsonStr());
          delete json.tagsForNotSync;
          return qconfig._validQuihexConfig(json)
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Config file is broken. Please remove config file > \'$ rm .tmp/.quihexrc\', and re-init > \'$ quihex init\'');
            });
        });
      });
      after(() => {
        qconfig.getConfigFilePath.restore();
      });
    });
  });

  describe('createConfigObj(quiverLibPath, hexoRootPath, syncNotebook)', () => {
    context('when input values are valid', () => {
      it('create config obj', () => {
        var obj = qconfig.createConfigObj('qlibpath', 'hexorootpath', {name:'testname', uuid:'testuuid'});
        assert(obj.quiver === 'qlibpath');
        assert(obj.hexo === 'hexorootpath');
        assert(obj.syncNotebook.name === 'testname');
        assert(obj.syncNotebook.uuid === 'testuuid');
        assert(obj.tagsForNotSync.length === 3);
        assert(obj.tagsForNotSync[0] === 'hide');
        assert(obj.tagsForNotSync[1] === 'wip');
        assert(obj.tagsForNotSync[2] === 'secret');
      });
    });
  });

  describe('writeConfig(configObj)', () => {
    context('when config obj is valid', () => {
      before(() => {
        let stub = sinon.stub(qconfig, 'getConfigFilePath');
        stub.withArgs().returns('.tmp/.quihexrc');
        mkdir.sync('.tmp');
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
      after(() => {
        qconfig.getConfigFilePath.restore();
        del.sync('.tmp');
      });
    });
  });
});
