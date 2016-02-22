import path from 'path'
import pathExists from 'path-exists'

import quiverUtil from './utils/quiver-util'
import fileUtil from './utils/file-util'
import hexoUtil from './utils/hexo-util';

class QuihexCore {

  validQuiverLib(quiverLibPath) {
    return quiverUtil.validQuiverLib(quiverLibPath);
  }

  validHexoRoot(hexoRootPath) {
    return hexoUtil.validHexoRoot(hexoRootPath);
  }

  getAllNotebookMetaFiles(quiverLibPath) {
    return quiverUtil.getAllNotebookMetaFiles(quiverLibPath);
  }

  getUserNotebookNames(config) {
    return quiverUtil.getAllNotebookMetaFiles(config.quiver)
      .then((notebooks) => {
        if (notebooks.length === 0) {
          return Promise.reject(new Error('Please create one or more your notebooks.'));
        }
        return Promise.resolve(notebooks);
      });
  }

  getSyncNoteFilePaths(quihexConfig) {
    return this._getSyncNotebookPath(quihexConfig)
      .then((syncNotebookPath) => {
        return quiverUtil.getNotePaths(syncNotebookPath);
      })
      .then((paths) => {
        return Promise.resolve(
          paths.filter((filepath) => {
            return path.extname(filepath) === '.qvnote'
          }));
      });
  }

  _getSyncNotebookPath(quihexConfig) {
    return new Promise((resolve) => {
      resolve(path.join(quihexConfig.quiver, quihexConfig.syncNotebook.uuid + '.qvnotebook'));
    });
  }

  getAllBlogStatus(config, notePaths) {
    return Promise.all(
      notePaths.map((notePath) => {
        return quiverUtil.loadNoteFile(notePath)
          .then((note) => {
            return quiverUtil.convertToHexoPostObj(note)
          })
          .then((hexoPostObj) => {
            return this._getBlogStatus(config, hexoPostObj)
          })
      })
    );
  }

  _getBlogStatus(config, hexoPostObj) {
    return hexoUtil.loadHexoConfig(config.hexo)
      .then((hexoConfig) => {

        var postsRoot = path.join(config.hexo, hexoConfig.source_dir, '_posts');
        var lastFilePath = path.join(postsRoot, `${hexoPostObj.filename}.md`);
        var tempFilePath = path.join(postsRoot, `.__tmp__.${hexoPostObj.filename}.md`);

        var createStatus = (status) => {
          return {
            hexoPostObj: hexoPostObj,
            status: status
          }
        }

        // if quihex note has not sync tag, skip sync it.
        if (hexoPostObj.tags.filter((tag) => {
            return (config.tagsForNotSync.indexOf(tag) !== -1);
          }).length > 0) {
          return Promise.resolve(createStatus('skip'));
        }

        return pathExists(lastFilePath)
          .then((exists) => {
            if (!exists) {
              return Promise.resolve(createStatus('new'));
            }
            return this._writeHexoPost(hexoPostObj, tempFilePath)
              .then(() => {
                return fileUtil.isEqualTextOfTwoFiles(lastFilePath, tempFilePath)
              })
              .then((isEqual) => {
                return Promise.resolve(createStatus(isEqual ? 'stable' : 'update'));
              });
          })
      });
  }

  _writeHexoPost(postObj, postPath) {
    return fileUtil.writeFilePromise(postPath, hexoUtil.toHexoPostString(postObj), 'utf-8');
  }
}

export default new QuihexCore();