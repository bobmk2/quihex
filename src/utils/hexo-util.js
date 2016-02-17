import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

class HexoUtil {
  getHexoConfig(hexoRoot) {
    return new Promise((resolve, reject) => {
      var confPath = path.join(hexoRoot,'_config.yml');
      fs.readFile(confPath, 'utf-8', (err, obj) => {
        if (err) {
          reject(err);
        }
        resolve(obj);
      });
    })
      .then((file) => {
        var ymlobj = yaml.safeLoad(file);

        // filter unnecessary fields
        var config = {};
        config.source_dir = ymlobj.source_dir;
        config.date_format = ymlobj.date_format;
        config.time_format = ymlobj.time_format;

        return Promise.resolve(config);
      })
  }

  toMarkdownPost(base) {
    var obj = {};
    obj.filename = base.title.split(' ').join('-');

    obj.title = base.title;
    obj.date = '';
    obj.tags = base.tags;
    obj.content = base.content;

    return obj;
  }

  writePost(hexoRoot, postObj, tmp) {
    return this.getHexoConfig(hexoRoot)
      .then((hexoConfig) => {
        var postsRoot = path.join(hexoRoot, hexoConfig.source_dir, '_posts');

        var toMdText = (postObj) => {
          var text = [];
          text.push('----');
          text.push(`title: ${postObj.title}`);
          text.push(`date: ${postObj.date}`);
          text.push('tags:');
          postObj.tags.forEach((tag) => {
            text.push(`- ${tag}`);
          });
          text.push('----');
          text.push(postObj.content);
          return text.join('\n');
        };

        var filename = `${tmp ? '.__tmp__.' : ''}${postObj.filename}.md` ;
        var postPath = path.join(postsRoot, filename);
        return new Promise((resolve, reject) => {
          fs.writeFile(postPath, toMdText(postObj), 'utf-8', (err, obj) => {
            if (err) {
              reject(err);
            }
            resolve(postPath);
          });
        });
      });
  }
}

export default new HexoUtil();
