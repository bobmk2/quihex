import path from 'path'
import pathExists from 'path-exists';

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
        return Promise.resolve(notebooks.map((notebooks) => notebooks.name));
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

  writeAsHexoPosts(config, hexoPostObj) {
    return hexoUtil.loadHexoConfig(config.hexo)
      .then((hexoConfig) => {
        var postsRoot = path.join(config.hexo, hexoConfig.source_dir, '_posts');
        var filePath = path.join(postsRoot, `${hexoPostObj.filename}.md`);

        return fileUtil.writeFilePromise(filePath, hexoUtil.toHexoPostString(hexoPostObj), 'utf-8');
      });
  }

  _getBlogStatus(quihexConfig, hexoPostObj) {
    return hexoUtil.loadHexoConfig(quihexConfig.hexo)
      .then((hexoConfig) => {

        var postsRoot = path.join(quihexConfig.hexo, hexoConfig.source_dir, '_posts');
        var lastFilePath = path.join(postsRoot, `${hexoPostObj.filename}.md`);

        var createStatus = (status) => {
          return {
            hexoPostObj: hexoPostObj,
            status: status
          }
        }

        // if quihex note dose'nt have sync tag, skip sync it.
        if (Array.from(new Set(hexoPostObj.tags.concat(quihexConfig.tagsForSync)))) {
          return Promise.resolve(createStatus('skip'));
        }

        return pathExists(lastFilePath)
          .then((exists) => {

            // it is new if last file is not found
            if (!exists) {
              return Promise.resolve(createStatus('new'));
            }

            return fileUtil.readFilePromise(lastFilePath)
              .then((lastPosts) => {
                var isEqual = lastPosts === hexoUtil.toHexoPostString(hexoPostObj);
                return Promise.resolve(createStatus(isEqual ? 'stable' : 'update'));
              });
          })
      });
  }
}

export default new QuihexCore();
