import assert from 'power-assert';
import quiverUtil from '../../src/utils/quiver-util';

import jsonFile from 'jsonfile';
import mkdir from 'mkdirp';
import del from 'del';

describe( 'getNotebookPath(config)', () => {
  context( 'when config has necessary fields', () => {
    it ('should get notebook path', () => {
      var data = {
        quiver: '/Users/me/quiver.qvlibrary',
        syncNotebook: { name: 'Diary',  uuid: 'TEST-UUID' }
      };
      return quiverUtil.getNotebookPath(data)
        .then((value) => {
          assert(value === '/Users/me/quiver.qvlibrary/TEST-UUID.qvnote');
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

describe('loadNoteFile(notePath', () => {
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