import jsonFile from 'jsonfile';

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
}

export default new FileUtil();