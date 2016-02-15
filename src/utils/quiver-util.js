import pathExists from 'path-exists';
import path from 'path';
import clct from './cli-color-template';
import fileUtil from './file-util';

class QuiverUtil {
  getNotebookPath(config) {
    return new Promise( (resolve, reject) => {
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
      .then( (exists) => {
        if (!exists) {
          return Promise.reject(`Notebook meta file is not found [${metaPath}]`);
        }
        return pathExists(contentPath);
      })
      .then ( (exists) => {
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
      .then ( (results) => {
        return {
          meta: results[0],
          content: results[1]
        }
      });
  }

  toQuiverObj(notebook) {
    return new Promise( (resolve, reject) => {
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
