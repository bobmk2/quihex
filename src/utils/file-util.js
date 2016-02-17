import jsonFile from 'jsonfile';
import fs from 'fs';
import path from 'path';

class FileUtil {
  readJsonFilePromise(path) {
    return new Promise( (resolve, reject) => {
      jsonFile.readFile(path, (err, obj) => {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    });
  }

  readFilePromise(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf-8', (err, obj) => {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    });
  }

  getChildrenFilePaths(rootPath) {
    return this.readDir(rootPath)
      .then((files) => {
        var paths = files.map((file)=> {
          return path.join(rootPath, file);
        });
        return Promise.resolve(paths);
      });
  }

  readDir(path) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, files) => {
        if (err) {
          reject(err);
        }
        resolve(files);
      })
    });
  }
}

export default new FileUtil();