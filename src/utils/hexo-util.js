class HexoUtil {
  toMarkdownPost(base) {
    var obj = {};
    obj.filename = base.title.split(' ').join('-');

    obj.title = base.title;
    obj.date = '';
    obj.tags = base.tags;
    obj.content = base.content;

    return obj;
  }

  writePost(hexoRootPath, postObj) {
    return new Promise( (resolve, reject) => {

    });
  }
}

export default new HexoUtil();
