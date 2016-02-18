import pathExists from 'path-exists';
import path from 'path';
import fs from 'fs';
import fsSync from 'fs-sync';
import expandTilde from 'expand-tilde';

import clct from './cli-color-template';
import fileUtil from './file-util';

class QuiverUtil {

  isValidQuiverLib(qvLibPath) {
    var expandPath = expandTilde(qvLibPath);

    // quiver will have default notebook for trash
    var trashNotebook = path.join(expandPath, 'Trash.qvnotebook');

    return pathExists(expandPath)
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

  /**
   * return all notebook meta infomation
   *
   * @param qvLibPath
   * @returns Promise.resolve([{"name":"xxx", "uuid": "yyy"}, ...])
   */
  getAllNotebooksMeta(qvLibPath) {
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

  loadNotebookMeta(qvLibPath, notebookFileName) {
    return fileUtil.readJsonFilePromise(path.join(qvLibPath, notebookFileName, 'meta.json'));
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
      resolve(path.join(config.quiver, config.syncNotebook.uuid + '.qvnotebook'));
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

  convertToHexoObj(notebook) {
    return new Promise((resolve, reject) => {
      var title = notebook.meta.title;
      var tags = notebook.meta.tags;

      var obj = {};
      obj.filename = title.split(' ').join('-');
      obj.title = title;

      var cdate = new Date(notebook.meta.created_at * 1000);
      var toDD = (val) => {
        return ('0' + val).slice(-2);
      };
      obj.date = `${cdate.getFullYear()}-${toDD(cdate.getMonth()+1)}-${toDD(cdate.getDate())} ${toDD(cdate.getHours())}:${toDD(cdate.getMinutes())}:${toDD(cdate.getSeconds())}`;

      obj.tags = tags;
      obj.content = notebook.content.cells
        .filter((cell) => {
          return cell.type === 'markdown';
        })
        .map((cell) => {
          return cell.data;
        })
        .join('\n\n');

      resolve(obj);
    });
  }

}

export default new QuiverUtil();
