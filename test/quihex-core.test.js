import assert from 'power-assert';
import sinon from 'sinon';

import path from 'path';
import del from 'del';
import mkdir from 'mkdirp';
import fs from 'fs';
import pathExists from 'path-exists';
import getHomePath from 'home-path';

import qcore from '../src/quihex-core';
import quiverUtil from '../src/utils/quiver-util';

describe('QuihexCore', () => {

  describe('getUserNotebookNames(config)', () => {
    context('when user notebooks exist', () => {
      before(() => {
        let stub = sinon.stub(quiverUtil, 'getAllNotebookMetaFiles');
        var metaFiles = [
          {name: 'blog'},{name: 'test'}
        ];
        stub.withArgs('quiver-path').returns(Promise.resolve(metaFiles));
      });
      it('should get notebook names', () => {
        return qcore.getUserNotebookNames({quiver:'quiver-path'})
          .then((names) => {
            assert(names[0] === 'blog');
            assert(names[1] === 'test');
          });
      });
      after(() => {
        quiverUtil.getAllNotebookMetaFiles.restore();
      });
    });
    context('when user notebooks do not exist', () => {
      before(() => {
        let stub = sinon.stub(quiverUtil, 'getAllNotebookMetaFiles');
        var metaFiles = [];
        stub.withArgs('quiver-path').returns(Promise.resolve(metaFiles));
      });
      it('should catch error', () => {
        return qcore.getUserNotebookNames({quiver:'quiver-path'})
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'Please create one or more your notebooks.');
          });
      });
      after(() => {
        quiverUtil.getAllNotebookMetaFiles.restore();
      });
    });
  });

  describe('getSyncNoteFilePaths(quihexConfig)', () => {
    context('when user notes exist', () => {
      before(() => {
        let stub = sinon.stub(qcore, '_getSyncNotebookPath');
        stub.withArgs({test: 'hoge'}).returns(Promise.resolve('test_path'));
        let stub2 = sinon.stub(quiverUtil, 'getNotePaths');
        var notePaths = ['sample1.qvnote', 'sample2.qvnote', 'sample3.qvnote'];
        stub2.withArgs('test_path').returns(Promise.resolve(notePaths));
      });
      it('should get note paths', () => {
        return qcore.getSyncNoteFilePaths({test: 'hoge'})
          .then((paths) => {
            assert(paths[0] === 'sample1.qvnote');
            assert(paths[1] === 'sample2.qvnote');
            assert(paths[2] === 'sample3.qvnote');
          });
      });
      after(() => {
        qcore._getSyncNotebookPath.restore();
        quiverUtil.getNotePaths.restore();
      });
    });
    context('when there are no user notes', () => {
      before(() => {
        let stub = sinon.stub(qcore, '_getSyncNotebookPath');
        stub.withArgs({test: 'fuga'}).returns(Promise.resolve('test_path'));
        let stub2 = sinon.stub(quiverUtil, 'getNotePaths');
        stub2.withArgs('test_path').returns(Promise.resolve([]));
      });
      it('should get note paths', () => {
        return qcore.getSyncNoteFilePaths({test: 'fuga'})
          .then((paths) => {
            assert(paths.length === 0);
          });
      });
      after(() => {
        qcore._getSyncNotebookPath.restore();
        quiverUtil.getNotePaths.restore();
      });
    });
    context('when user notes and un-note files exist', () => {
      before(() => {
        let stub = sinon.stub(qcore, '_getSyncNotebookPath');
        stub.withArgs({test: 'fuga'}).returns(Promise.resolve('test_path'));
        let stub2 = sinon.stub(quiverUtil, 'getNotePaths');
        stub2.withArgs('test_path').returns(Promise.resolve(['sample2.txt', 'sample1.qvnote']));
      });
      it('should get only note paths', () => {
        return qcore.getSyncNoteFilePaths({test: 'fuga'})
          .then((paths) => {
            assert(paths.length === 1);
            assert(paths[0] === 'sample1.qvnote');
          });
      });
      after(() => {
        qcore._getSyncNotebookPath.restore();
        quiverUtil.getNotePaths.restore();
      });
    });
  });


  describe('_getSyncNotebookPath(quihexConfig)', () => {
    context('when config obj has necessary fields', () => {
      it('should get notebook path', () => {
        var data = {
          quiver: '/Users/me/quiver.qvlibrary',
          syncNotebook: { uuid: 'TEST-UUID' }
        };
        return qcore._getSyncNotebookPath(data)
          .then((path) => {
            assert(path === '/Users/me/quiver.qvlibrary/TEST-UUID.qvnotebook');
          });
      });
    });
    context('when config obj is invalid', () => {
      it('should catch error', () => {
        return qcore._getSyncNotebookPath(null)
          .catch((err) => {
            assert(err.name === 'TypeError');
            assert(err.message === 'Cannot read property \'quiver\' of null');
          });
      });
    });
  });

});