import assert from 'power-assert';
import sinon from 'sinon';
import quiverUtil from '../../src/utils/quiver-util';
import fileUtil from '../../src/utils/file-util';

import jsonFile from 'jsonfile';
import mkdir from 'mkdirp';
import del from 'del';
import path from 'path';
import fs from 'fs';
import fsSync from 'fs-sync';
import pathExists from 'path-exists';

describe( 'isValidQuiverLibFile(qvLibPath)', () => {
  context('when lib dir and default notebook exists', () => {
    before( () => {
      mkdir.sync('.tmp/Quiver.qvlibrary/Trash.qvnotebook');
    });
    it('should is valid', () => {
      return quiverUtil.isValidQuiverLib('.tmp/Quiver.qvlibrary')
        .then((valid) => {
          assert(valid === true);
        });
    });
    after( () => {
      del.sync('.tmp')
    });
  });
  context('when lib dir is not found', () => {
    before( () => {
      mkdir.sync('.tmp');
    });
    it('should is invalid', () => {
      return quiverUtil.isValidQuiverLib('.tmp/Quiver.qvlibrary')
        .then((valid) => {
          assert(valid === false);
        })
    });
    after( () => {
      del.sync('.tmp')
    });
  });
  context('when trash notebook is not found', () => {
    before( () => {
      mkdir.sync('.tmp/Quiver.qvlibrary');
    });
    it('should is invalid', () => {
      return quiverUtil.isValidQuiverLib('.tmp/Quiver.qvlibrary')
        .then((valid) => {
          assert(valid === false);
        })
    });
    after( () => {
      del.sync('.tmp')
    });
  });
});

describe( 'getNotebookPath(config)', () => {
  context( 'when config has necessary fields', () => {
    it ('should get notebook path', () => {
      var data = {
        quiver: '/Users/me/quiver.qvlibrary',
        syncNotebook: { name: 'Diary',  uuid: 'TEST-UUID' }
      };
      return quiverUtil.getNotebookPath(data)
        .then((value) => {
          assert(value === '/Users/me/quiver.qvlibrary/TEST-UUID.qvnotebook');
        });
    })
  });

  context( 'when config file is not created', () => {
    it('should get error message', () => {
      return quiverUtil.getNotebookPath(undefined)
        .catch((err) => {
          assert(typeof err === 'string');
        });
    })
  });

  context( 'when quiver field is deleted', () => {
    it('should get error message', () => {
      var data = {
        syncNotebook: { name: 'Diary', uuid: 'TEST-UUID' }
      };
      return quiverUtil.getNotebookPath({data})
        .catch((err) => {
          assert(typeof err === 'string');
        })
    })
  });

  context( 'when syncNotebook field is deleted', () => {
    it('should get error message', () => {
      var data = {
        quiver: '/Users/me/quiver.qvlibrary'
      };
      return quiverUtil.getNotebookPath({data})
        .catch((err) => {
          assert(typeof err === 'string');
        })
    })
  });

  context( 'when syncNotebook.name field is deleted', () => {
    it('should get error message', () => {
      var data = {
        quiver: '/Users/me/quiver.qvlibrary',
        syncNotebook: { uuid: 'TEST-UUID' }
      };
      return quiverUtil.getNotebookPath({data})
        .catch((err) => {
          assert(typeof err === 'string');
        })
    })
  });

  context( 'when syncNotebook.uuid field is deleted', () => {
    it('should get error message', () => {
      var data = {
        quiver: '/Users/me/quiver.qvlibrary',
        syncNotebook: { name: 'Diary' }
      };
      return quiverUtil.getNotebookPath({data})
        .catch((err) => {
          assert(typeof err === 'string');
        })
    })
  });
});

describe('getAllNotebooksMeta(qvLibPath)', () => {
  context('when users notebooks exist', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib/123.qvnotebook');
      mkdir.sync('.tmp/qvlib/456.qvnotebook');
      mkdir.sync('.tmp/qvlib/789.qvnotebook');

      let stub = sinon.stub(quiverUtil, 'loadNotebookMeta');
      stub.withArgs('.tmp/qvlib','123.qvnotebook').returns({name:'Charlie'});
      stub.withArgs('.tmp/qvlib','456.qvnotebook').returns({name:'Bob'});
      stub.withArgs('.tmp/qvlib','789.qvnotebook').returns({name:'Alice'});

      let stub2 = sinon.stub(quiverUtil, 'isValidNotebook');
      stub2.withArgs('.tmp/qvlib', '123.qvnotebook').returns(Promise.resolve(true));
      stub2.withArgs('.tmp/qvlib', '456.qvnotebook').returns(Promise.resolve(true));
      stub2.withArgs('.tmp/qvlib', '789.qvnotebook').returns(Promise.resolve(true));
    });
    it ('should get users notebook meta information', () => {
      return quiverUtil.getAllNotebooksMeta('.tmp/qvlib')
        .then( (result) => {
          assert(result.length === 3);
          assert(result[0].name === 'Charlie');
          assert(result[1].name === 'Bob');
          assert(result[2].name === 'Alice');
        });
    });
    after( () => {
      del.sync('.tmp');
      quiverUtil.loadNotebookMeta.restore();
      quiverUtil.isValidNotebook.restore();
    });
  });
  context('when users and default notebooks exist', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib/123.qvnotebook');
      mkdir.sync('.tmp/qvlib/Trash.qvnotebook');
      mkdir.sync('.tmp/qvlib/Inbox.qvnotebook');

      let stub = sinon.stub(quiverUtil, 'loadNotebookMeta');
      stub.withArgs('.tmp/qvlib','123.qvnotebook').returns({name:'Test'});

      let stub2 = sinon.stub(quiverUtil, 'isValidNotebook');
      stub2.withArgs('.tmp/qvlib', '123.qvnotebook').returns(Promise.resolve(true));
      stub2.withArgs('.tmp/qvlib', 'Trash.qvnotebook').returns(Promise.resolve(true));
      stub2.withArgs('.tmp/qvlib', 'Inbox.qvnotebook').returns(Promise.resolve(true));
    });
    it ('should get only users notebook meta information', () => {
      return quiverUtil.getAllNotebooksMeta('.tmp/qvlib')
        .then( (result) => {
          assert(result.length === 1);
          assert(result[0].name === 'Test');
        });
    });
    after( () => {
      del.sync('.tmp');
      quiverUtil.loadNotebookMeta.restore();
      quiverUtil.isValidNotebook.restore();
    });
  });
  context('when only default notebooks exist', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib/Trash.qvnotebook');
      mkdir.sync('.tmp/qvlib/Inbox.qvnotebook');

      let stub2 = sinon.stub(quiverUtil, 'isValidNotebook');
      stub2.withArgs('.tmp/qvlib/', 'Trash.qvnotebook').returns(Promise.resolve(true));
      stub2.withArgs('.tmp/qvlib/', 'Inbox.qvnotebook').returns(Promise.resolve(true));
    });
    it ('should get empty', () => {
      return quiverUtil.getAllNotebooksMeta('.tmp/qvlib')
        .then( (result) => {
          assert(result.length === 0);
        });
    });
    after( () => {
      del.sync('.tmp');
      quiverUtil.isValidNotebook.restore();
    });
  });
  context('when invalid notebook exists', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib/test.dir');

      let stub2 = sinon.stub(quiverUtil, 'isValidNotebook');
      stub2.withArgs('.tmp/qvlib/', 'test.dir').returns(Promise.resolve(false));
    });
    it ('should filter it', () => {
      return quiverUtil.getAllNotebooksMeta('.tmp/qvlib')
        .then( (result) => {
          assert(result.length === 0);
        });
    });
    after( () => {
      del.sync('.tmp');
      quiverUtil.isValidNotebook.restore();
    });
  });
});

describe('loadNoteFile(notePath)', () => {
  context('when all necessary files exist', () => {
    before( () => {
      mkdir.sync('.tmp/note');
      jsonFile.writeFileSync('.tmp/note/meta.json', {title: 'meta'});
      jsonFile.writeFileSync('.tmp/note/content.json', {title: 'content'});
    });

    it ('should read meta and content data', () => {
      return quiverUtil.loadNoteFile('.tmp/note')
        .then( (result) => {
          assert(result.meta.title === 'meta');
          assert(result.content.title === 'content');
        })
    });
    after( () => {
      del.sync('.tmp');
    });
  });

  context('when meta file is not found', () => {
    before( () => {
      mkdir.sync('.tmp/note');
      jsonFile.writeFileSync('.tmp/note/content.json', {title: 'content'});
    });
    it ('should read meta and content data', () => {
      return quiverUtil.loadNoteFile('.tmp/note')
        .catch( (err) => {
          assert(typeof err === 'string');
        });
    });
    after( () => {
      del.sync('.tmp');
    });
  });

  context('when content file is not found', () => {
    before( () => {
      mkdir.sync('.tmp/note');
      jsonFile.writeFileSync('.tmp/note/content.json', {title: 'content'});
    });
    it ('should read meta and content data', () => {
      return quiverUtil.loadNoteFile('.tmp/note')
        .catch( (err) => {
          assert(typeof err === 'string');
        });
    });
    after( () => {
      del.sync('.tmp');
    });
  });
});

describe('toQuiverObj(notebook)', () => {
  context('when note has necessary data', () => {
    it ('should convert to quiver obj', () => {
      var data = {
        meta: {
          title: 'test-title',
          tags: ['hexo', 'quiver', 'test'],
          created_at: 1455547707,
          updated_at: 1455548005
        },
        content: {
          cells: [
            {
              type: 'markdown',
              data: 'line-one'
            },
            {
              type: 'markdown',
              data: 'line-two'
            }
          ]
        }
      }
      return quiverUtil.toQuiverObj(data)
        .then( (result) => {
          assert(result.title === data.meta.title);
          assert(result.tags === data.meta.tags);
          assert(result.createdAt === data.meta.created_at);
          assert(result.updatedAt === data.meta.updated_at);
          assert(result.contents === data.content.cells);
        });
    });
  });
  context('when meta and content have another title', () => {
    it ('should adopt meta title', () => {
      var data = {
        meta: {
          title: 'test-title'
        },
        content: {
          title: 'another-title'
        }
      }
      return quiverUtil.toQuiverObj(data)
        .then( (result) => {
          assert(result.title === data.meta.title);
        });
    });
  });
  context('when meta data is undefined', () => {
    it ('should catch TypeError', () => {
      var data = {
        content: {
          cells: [{
            type: 'markdown',
            data: 'line-one'
          }]
        }
      }
      return quiverUtil.toQuiverObj(data)
        .catch( (err) => {
          assert(err.name === 'TypeError');
        })
    });
  });
  context('when content data is undefined', () => {
    it ('should catch TypeError', () => {
      var data = {
        meta: {
          title: 'test-title',
          tags: ['hexo', 'quiver', 'test'],
          created_at: 1455547707,
          updated_at: 1455548005
        }
      }
      return quiverUtil.toQuiverObj(data)
        .catch( (err) => {
          assert(err.name === 'TypeError');
        })
    });
  });
});

describe('loadNotebookMeta(qvLibPath, notebookName)', () => {
  context('when meta.json exists', () => {
    before(() => {
      let stub = sinon.stub(fileUtil, 'readJsonFilePromise');
      stub.withArgs('.tmp/qvlib/123.qvnotebook/meta.json').returns(Promise.resolve({content: 'test'}));
    });
    it('should return meta.json content', () => {
      return quiverUtil.loadNotebookMeta('.tmp/qvlib', '123.qvnotebook')
        .then( (result) => {
          assert(result.content === 'test');
        });
    });
    after(() => {
      fileUtil.readJsonFilePromise.restore();
    });
  });
  context('when meta.json dose not exist', () => {
    it('should return error', () => {
      return quiverUtil.loadNotebookMeta('.tmp/qvlib', '123.qvnotebook')
        .catch( (err) => {
          assert(typeof err === 'object');
          assert(err.errno === -2);
          assert(err.code === 'ENOENT');
          assert(err.syscall === 'open');
          assert(err.path === '.tmp/qvlib/123.qvnotebook/meta.json');
        });
    });
  });
});

describe('isValidNotebook(qvLibPath, notebookDirName)', () => {
  context('when notebook has meta.json', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib/Test.qvnotebook');
      jsonFile.writeFileSync('.tmp/qvlib/Test.qvnotebook/meta.json', {name:'test'});
    });
    it('should is valid', () => {
      return quiverUtil.isValidNotebook('.tmp/qvlib', 'Test.qvnotebook')
        .then((valid) => {
          assert(valid === true);
        });
    });
    after( () => {
      del.sync('.tmp');
    });
  });
  context('when notebook does not exist', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib/Testtt.qbnotebook');
    });
    it('should is invalid', () => {
      return quiverUtil.isValidNotebook('.tmp/qvlib', 'Test.qbnotebook')
        .then((valid) => {
          assert(valid === false);
        });
    });
    after( () => {
      del.sync('.tmp');
    });
  });
  context('when notebook\'s extname is not qvnotebook', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib/Test.qbnotebook');
    });
    it('should is invalid', () => {
      var spy = sinon.spy(path, 'extname');
      return quiverUtil.isValidNotebook('.tmp/qvlib', 'Test.qbnotebook')
        .then((valid) => {
          assert(spy.calledOnce);
          assert(valid === false);
        });
    });
    after( () => {
      del.sync('.tmp');
    });
  });
  context('when notebook is file', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib');
      fs.writeFileSync('.tmp/qvlib/Test.qvnotebook', 'test', 'utf8');
    });
    it('should is invalid', () => {
      var spy = sinon.spy(fsSync, 'isDir');
      return quiverUtil.isValidNotebook('.tmp/qvlib', 'Test.qvnotebook')
        .then((valid) => {
          assert(spy.calledOnce);
          assert(valid === false);
        });
    });
    after( () => {
      del.sync('.tmp');
    });
  });
  context('when notebook dose not have meta.json', () => {
    before( () => {
      mkdir.sync('.tmp/qvlib/Test.qvnotebook');
    });
    it('should is invalid', () => {
      return quiverUtil.isValidNotebook('.tmp/qvlib', 'Test.qvnotebook')
        .then((valid) => {
          assert(valid === false);
        });
    });
    after( () => {
      del.sync('.tmp');
    });
  });
});