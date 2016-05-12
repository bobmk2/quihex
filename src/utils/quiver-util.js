import pathExists from 'path-exists';
import path from 'path';
import fs from 'fs';
import fsSync from 'fs-sync';
import expandTilde from 'expand-tilde';
import fileUtil from './file-util';

class QuiverUtil {

  validQuiverLib(qvLibPath) {
    var expandPath = expandTilde(qvLibPath);

    // quiver will have default notebook for trash
    var trashNotebook = path.join(expandPath, 'Trash.qvnotebook');

    return pathExists(expandPath)
      .then((exists) => {
        if (!exists) {
          return Promise.reject(new Error(`Input Quiver library path is not found. [${qvLibPath}]`));
        }
        return pathExists(trashNotebook);
      })
      .then((exists) => {
        if (!exists) {
          return Promise.reject(new Error(`Input Quiver library path will be not quiver library.(Needs Trash.qvnotebook) [${qvLibPath}]`));
        }
        return Promise.resolve();
      })
  }

  getNotePaths(notebookPath) {
    return fileUtil.readDir(notebookPath)
      .then((files) => {
        var paths = files.map((file)=> {
          return path.join(notebookPath, file);
        });
        return Promise.resolve(paths);
      })
      .then((paths) => {
        return Promise.resolve(
          paths.filter((filepath) => {
            return path.extname(filepath) === '.qvnote'
          }));
      });
  }

  /**
   * return all notebook meta file
   */
  getAllNotebookMetaFiles(qvLibPath) {
    return new Promise((resolve, reject) => {
      fs.readdir(qvLibPath, (err, files) => {
        if (err) {
          reject(err);
        }
        resolve(files);
      })
    })
      .then((files) => {
        // filter un-notebook files
        return Promise.all(
          files.map((file) => {
            return this._validNotebook(qvLibPath, file);
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

  _validNotebook(qvLibPath, notebookDirName) {
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

  loadNoteFile(notePath) {

    var metaPath = path.join(notePath, 'meta.json');
    var contentPath = path.join(notePath, 'content.json');

    return pathExists(metaPath)
      .then((exists) => {
        if (!exists) {
          return Promise.reject(new Error(`Notebook meta file is not found [${metaPath}]`));
        }
        return pathExists(contentPath);
      })
      .then((exists) => {
        if (!exists) {
          return Promise.reject(new Error(`Notebook content file is not found [${contentPath}]`));
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

  convertToHexoPostObj(noteObj) {
    return new Promise((resolve) => {
      var title = noteObj.meta.title;
      var tags = noteObj.meta.tags;

      var obj = {};
      obj.filename = title.split(' ').join('-');
      obj.title = title;

      var cdate = new Date(noteObj.meta.created_at * 1000);
      var toDD = (val) => {
        return ('0' + val).slice(-2);
      };
      obj.date = `${cdate.getFullYear()}-${toDD(cdate.getMonth() + 1)}-${toDD(cdate.getDate())} ${toDD(cdate.getHours())}:${toDD(cdate.getMinutes())}:${toDD(cdate.getSeconds())}`;

      obj.tags = tags;
      obj.content = noteObj.content.cells
        .map((cell) => {
          if (cell.type === 'markdown') {
            return cell.data;
          } else if (cell.type === 'code') {
            return `\`\`\`${cell.language}\n${cell.data}\n\`\`\``;
          }
        })
        .join('\n\n');
      resolve(obj);
    });
  }

}

export default new QuiverUtil();
