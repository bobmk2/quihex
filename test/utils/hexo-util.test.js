import assert from 'power-assert';
import sinon from 'sinon';
import del from 'del';
import mkdir from 'mkdirp';
import fs from 'fs';

import hexoUtil from '../../src/utils/hexo-util';

describe(('HexoUtil'), () => {
  describe('loadHexoConfig(hexoRoot)', () => {
    context('when config file exists', () => {
      before( () => {
        mkdir.sync('.tmp/hexo-root');
        var yml = 'source_dir: testsource\ndate_format: TEST-TO-TEST\ntime_format: AB:CD:EF';
        fs.writeFileSync('.tmp/hexo-root/_config.yml', yml, 'utf8');
      });
      it ('should load config file', () => {
        return hexoUtil.loadHexoConfig('.tmp/hexo-root')
          .then((config) => {
            assert(config.source_dir === 'testsource');
            assert(config.date_format === 'TEST-TO-TEST');
            assert(config.time_format === 'AB:CD:EF');
          });
      });
      after( () => {
        del.sync('.tmp');
      });
    });
    context('when config file is invalid', () => {
      context('without source_dir field', () => {
        before( () => {
          mkdir.sync('.tmp/hexo-root');
          var yml = 'date_format: TEST-TO-TEST\ntime_format: AB:CD:EF';
          fs.writeFileSync('.tmp/hexo-root/_config.yml', yml, 'utf8');
        });
        it ('should catch err', () => {
          return hexoUtil.loadHexoConfig('.tmp/hexo-root')
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Hexo config file is not valid. [.tmp/hexo-root/_config.yml]')
            });

        });
        after( () => {
          del.sync('.tmp');
        });
      });
      context('without date_format field', () => {
        before( () => {
          mkdir.sync('.tmp/hexo-root');
          var yml = 'source_dir: testsource\ntime_format: AB:CD:EF';
          fs.writeFileSync('.tmp/hexo-root/_config.yml', yml, 'utf8');
        });
        it ('should catch err', () => {
          return hexoUtil.loadHexoConfig('.tmp/hexo-root')
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Hexo config file is not valid. [.tmp/hexo-root/_config.yml]')
            });
        });
        after( () => {
          del.sync('.tmp');
        });
      });
      context('without time_format field', () => {
        before( () => {
          mkdir.sync('.tmp/hexo-root');
          var yml = 'source_dir: testsource\ndate_format: TEST-TO-TEST';
          fs.writeFileSync('.tmp/hexo-root/_config.yml', yml, 'utf8');
        });
        it ('should catch err', () => {
          return hexoUtil.loadHexoConfig('.tmp/hexo-root')
            .catch((err) => {
              assert(err.name === 'Error');
              assert(err.message === 'Hexo config file is not valid. [.tmp/hexo-root/_config.yml]')
            });

        });
        after( () => {
          del.sync('.tmp');
        });
      });
    });
    context('when config file do not exist', () => {
      it ('should catch error', () => {
        return hexoUtil.loadHexoConfig('.tmp/hexo-root')
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'ENOENT: no such file or directory, open \'.tmp/hexo-root/_config.yml\'')
          });
      });
    });
  });

  describe(('validHexoRoot(hexoRootPath)'), () => {
    context('when _config.yml exists', () => {
      before( () => {
        mkdir.sync('.tmp/hexo-root');
        fs.writeFileSync('.tmp/hexo-root/_config.yml', 'test', 'utf8');
      });
      it ('should be valid', () => {
        return hexoUtil.validHexoRoot('.tmp/hexo-root')
          .then(() => {
            assert(true);
          });
      });
      after( () => {
        del.sync('.tmp');
      });
    });
    context('when hexo path is not found', () => {
      it ('should be invalid', () => {
        return hexoUtil.validHexoRoot('.tmp/hexo-root')
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'Input hexo root path is not found. [.tmp/hexo-root]')
          });
      });
    });
    context('when _config.yml do not exist', () => {
      before( () => {
        mkdir.sync('.tmp/hexo-root');
      });
      it ('should be invalid', () => {
        return hexoUtil.validHexoRoot('.tmp/hexo-root')
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'Input hexo root path will be not hexo root.(Needs _config.yml) [.tmp/hexo-root]')
          });
      });
      after( () => {
        del.sync('.tmp');
      });
    });
  });

  describe('toHexoPostString(hexoPostObj)', () => {
    context('when hexo post obj is valid', () => {
      context('and have tags', () => {
        it ('should convert post string', () => {
          var obj = {};
          obj.title = 'test';
          obj.date = 'sampledate';
          obj.tags = [];
          obj.content = 'sampletext';
          var str = hexoUtil.toHexoPostString(obj)
          var texts = str.split('\n');
          assert(texts[1] === 'title: test');
          assert(texts[2] === 'date: sampledate');
          assert(texts[3] === 'tags: ');
          assert(texts[5] === 'sampletext');
        });
      });
      context('and have no tag', () => {
        it ('should convert post string', () => {
          var obj = {};
          obj.title = 'test';
          obj.date = 'sampledate';
          obj.tags = ['test', 'sample'];
          obj.content = 'sampletext';
          var str = hexoUtil.toHexoPostString(obj)
          var texts = str.split('\n');
          assert(texts[1] === 'title: test');
          assert(texts[2] === 'date: sampledate');
          assert(texts[3] === 'tags: ');
          assert(texts[4] === '- test');
          assert(texts[5] === '- sample');
          assert(texts[7] === 'sampletext');
        });
      });
    });
  });

});