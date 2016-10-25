import assert from 'power-assert';
import sinon from 'sinon';

import path from 'path';
import del from 'del';
import mkdir from 'mkdirp';
import fs from 'fs';
import pathExists from 'path-exists';
import getHomePath from 'home-path';

import Qcore from '../src/quihex-core';
import qconfig from '../src/quihex-config';
import quiverUtil from '../src/utils/quiver-util';

async function createConfigAsync(configJson) {
  qconfig.__Rewire__('_existsConfigFile', () => Promise.resolve(true));
  qconfig.__Rewire__('_readJsonConfigFile', () => Promise.resolve(configJson))

  const conf = await qconfig.loadConfigUnsafety();

  qconfig.__ResetDependency__('_existsConfigFile');
  qconfig.__ResetDependency__('_readJsonConfigFile');

  return conf;
}

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
      after(() => {
        quiverUtil.getAllNotebookMetaFiles.restore();
      });
      it('should get notebook names', async () => {
        const config = await createConfigAsync({quiver:'quiver-path'});
        const qcore = Qcore.createCore(config);

        return qcore.getUserNotebookNames()
          .then((names) => {
            assert(names[0] === 'blog');
            assert(names[1] === 'test');
          });
      });
    });
    context('when user notebooks do not exist', () => {
      before(() => {
        let stub = sinon.stub(quiverUtil, 'getAllNotebookMetaFiles');
        var metaFiles = [];
        stub.withArgs('quiver-path').returns(Promise.resolve(metaFiles));
      });
      after(() => {
        quiverUtil.getAllNotebookMetaFiles.restore();
      });
      it('should catch error', async () => {
        const config = await createConfigAsync({quiver:'quiver-path'});
        const qcore = Qcore.createCore(config);

        return qcore.getUserNotebookNames()
          .catch((err) => {
            assert(err.name === 'Error');
            assert(err.message === 'Please create one or more your notebooks.');
          });
      });
    });
  });

  describe('getSyncNoteFilePaths()', () => {
    context('when user notes exist', () => {
      before(() => {
        let stub = sinon.stub(quiverUtil, 'getNotePaths');
        var notePaths = ['sample1.qvnote', 'sample2.qvnote', 'sample3.qvnote'];
        stub.withArgs('quiver_path/sample_uuid.qvnotebook').returns(Promise.resolve(notePaths));
      });
      after(() => {
        quiverUtil.getNotePaths.restore();
      });
      it('should get note paths', async () => {
        const config = await createConfigAsync({quiver: 'quiver_path', syncNotebook: {uuid:'sample_uuid'}});
        const qcore = Qcore.createCore(config);

        const paths = await qcore.getSyncNoteFilePaths();
        assert(paths[0] === 'sample1.qvnote');
        assert(paths[1] === 'sample2.qvnote');
        assert(paths[2] === 'sample3.qvnote');
      });
    });
    context('when there are no user notes', () => {
      before(() => {
        let stub = sinon.stub(quiverUtil, 'getNotePaths');
        stub.withArgs('quiver_path/sample_uuid.qvnotebook').returns(Promise.resolve([]));
      });
      after(() => {
        quiverUtil.getNotePaths.restore();
      });
      it('should get note paths', async () => {
        const config = await createConfigAsync({quiver: 'quiver_path', syncNotebook: {uuid:'sample_uuid'}});
        const qcore = Qcore.createCore(config);

        const paths = await qcore.getSyncNoteFilePaths();
        assert(paths.length === 0);
      });
    });
    context('when user notes and un-note files exist', () => {
      before(() => {
        let stub = sinon.stub(quiverUtil, 'getNotePaths');
        stub.withArgs('quiver_path/sample_uuid.qvnotebook').returns(Promise.resolve(['sample2.txt', 'sample1.qvnote', 'sample3.java']));
      });
      after(() => {
        quiverUtil.getNotePaths.restore();
      });
      it('should get only note paths', async () => {
        const config = await createConfigAsync({quiver: 'quiver_path', syncNotebook: {uuid:'sample_uuid'}});
        const qcore = Qcore.createCore(config);

        const paths = await qcore.getSyncNoteFilePaths();
        assert(paths.length === 1);
        assert(paths[0] === 'sample1.qvnote');
      });
    });
  });
});
