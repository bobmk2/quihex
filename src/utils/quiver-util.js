import pathExists from 'path-exists';
import path from 'path';
import fs from 'fs';
import fsSync from 'fs-sync';

import clct from './cli-color-template';
import fileUtil from './file-util';

class QuiverUtil {

  isValidQuiverLib(qvLibPath) {
    // quiver will have default notebook for trash
    var trashNotebook = path.join(qvLibPath, 'Trash.qvnotebook');

    return pathExists(qvLibPath)
      .then((exists) => {
        if (!exists) {
          return Promise.reject();
        }
        return pathExists(trashNotebook);
      })
      .then((exists) => {
        if (!exists) {
          return Promise.reject();
        }
        return Promise.resolve(true);
      })
      .catch(() => {
        return Promise.resolve(false);
      });
  }

  getNotebookTitles(qvLibPath) {
    return new Promise((resolve, reject) => {
      fs.readdir(qvLibPath, (err, files) => {
        if (err) {
          reject(err);
        }
        resolve(files);
      })
    })
      .then((files) => {
        return Promise.all(
          files.map((file) => {
            return this.isValidNotebook(qvLibPath, file);
          })
        ).then((results) => {
          return files.filter((file, idx) => {
            return results[idx];
          });
        });
      })
      .then((files) => {
        return Promise.all(
          files.filter((file) => {
            var basename = path.basename(file, '.qvnotebook');
            return basename !== 'Trash' && basename !== 'Inbox';
          }).map((fileName) => {
            return this.loadNotebookMeta(qvLibPath, fileName);
          }));
      })
      .then((metaFiles) => {
        return Promise.resolve(
          metaFiles.map((meta) => {
            return meta.name;
          }).sort());
      });
  }

  isValidNotebook(qvLibPath, notebookDirName) {
    return pathExists(path.join(qvLibPath, notebookDirName))
      .then((exists) => {
        if (!exists) {
          return Promise.reject();
        }
        return new Promise((resolve) => {
          if (path.extname(notebookDirName) !== '.qvnotebook'
            || !fsSync.isDir(path.join(qvLibPath, notebookDirName))) {
            resolve(false);
          }
          resolve(true);
        });
      })
      .then((result) => {
        if (!result) {
          return Promise.reject();
        }
        return pathExists(path.join(qvLibPath, notebookDirName, 'meta.json'));
      })
      .then((exists) => {
        if (!exists) {
          return Promise.reject();
        }
        return Promise.resolve(true);
      })
      .catch(() => {
        return Promise.resolve(false);
      });
  }

  loadNotebookMeta(qvLibPath, notebookName) {
    return fileUtil.readJsonFilePromise(path.join(qvLibPath, notebookName, 'meta.json'));
  }

  getNotebookPath(config) {
    return new Promise((resolve, reject) => {
      if (
        typeof config === 'undefined' ||
        typeof config.quiver === 'undefined' ||
        typeof config.syncNotebook === 'undefined' ||
        typeof config.syncNotebook.name === 'undefined' ||
        typeof config.syncNotebook.uuid === 'undefined') {
        reject(`Config file is broken. Please re-init ${clct.script('$ quihex init')}`)
      }
      resolve(path.join(config.quiver, config.syncNotebook.uuid + '.qvnote'));
    })
  }

  loadNoteFile(notePath) {
    var metaPath = path.join(notePath, 'meta.json');
    var contentPath = path.join(notePath, 'content.json');

    return pathExists(metaPath)
      .then((exists) => {
        if (!exists) {
          return Promise.reject(`Notebook meta file is not found [${metaPath}]`);
        }
        return pathExists(contentPath);
      })
      .then((exists) => {
        if (!exists) {
          return Promise.reject(`Notebook content file is not found [${metaPath}]`);
        }
        return Promise.all(
          [
            fileUtil.readJsonFilePromise(metaPath),
            fileUtil.readJsonFilePromise(contentPath)
          ]
        );
      })
      .then((results) => {
        return {
          meta: results[0],
          content: results[1]
        }
      });
  }

  toQuiverObj(notebook) {
    return new Promise((resolve, reject) => {
      var title = notebook.meta.title;
      var tags = notebook.meta.tags;
      var createdAt = notebook.meta.created_at;
      var updatedAt = notebook.meta.updated_at;

      var contents = notebook.content.cells;

      var obj = {};
      obj.title = title;
      obj.tags = tags;
      obj.createdAt = createdAt;
      obj.updatedAt = updatedAt;
      obj.contents = contents;

      resolve(obj);
    });
  }

}

export default new QuiverUtil();
