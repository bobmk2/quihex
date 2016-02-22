import jsonFile from 'jsonfile';
import fs from 'fs';
import path from 'path';

class FileUtil {
  readJsonFilePromise(path) {
    return new Promise((resolve, reject) => {
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

  writeFilePromise(path, text, encoding) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, text, encoding, (err) => {
        if (err) {
          reject(err);
        }
        resolve(path);
      });
    });
  }

  isEqualTextOfTwoFiles(firstFilePath, secondFilePath) {
    return Promise.all(
      [
        this.readFilePromise(firstFilePath),
        this.readFilePromise(secondFilePath)
      ]
      )
      .then((results) => {
        return Promise.resolve(results[0] === results[1]);
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