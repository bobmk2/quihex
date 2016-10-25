import path from 'path'
import pathExists from 'path-exists';

import quiverUtil from './utils/quiver-util';
import fileUtil from './utils/file-util';
import hexoUtil from './utils/hexo-util';
import arrUtil from './utils/array-util';

class QuihexCore {

  constructor(quihexConfig) {
    this.quihexConfig = quihexConfig;
  }

  /**
   * Use in 'ls-notebook'
   * return all notebook names
   *
   * @returns {Promise.<[String]>} notebook names
   */
  async getUserNotebookNames() {
    const quiverLibPath = this.quihexConfig.getQuiverLibPath();

    const metaFiles = await quiverUtil.getAllNotebookMetaFiles(quiverLibPath);
    if (metaFiles.length === 0) {
      return Promise.reject(new Error('Please create one or more your notebooks.'));
    }

    return metaFiles.map((notebooks) => notebooks.name);
  }

  /**
   * Use in 'sync'
   * return 'all' note paths in the notebook, it is sync target note or not.
   *
   * @returns {Promise.<[String]>} path array of note files
   */
  async getSyncNoteFilePaths() {
    const quiverLibPath = this.quihexConfig.getQuiverLibPath();
    const syncNotebookUUID = this.quihexConfig.getSyncNotebookUUID();

    const notebookPath = path.join(quiverLibPath, `${syncNotebookUUID}.qvnotebook`)
    const notePaths = await quiverUtil.getNotePaths(notebookPath);

    return notePaths.filter(filepath => {
      return path.extname(filepath) === '.qvnote'
    });
 }

  async getAllBlogStatus() {
    const notePaths = await this.getSyncNoteFilePaths();

    return Promise.all(
      notePaths.map(path => this._getBlogStatusEx(path))
    );
  }

  async writeAsHexoPosts(hexoPostObj) {
    const hexoRootPath = this.quihexConfig.getHexoRootPath();
    const hexoConfig = hexoUtil.loadHexoConfig(hexoRootPath);

    const postsRoot = path.join(hexoRootPath, hexoConfig.source_dir, '_posts');
    const filePath = path.join(postsRoot, `${hexoPostObj.filename}.md`);

    const hexoPostString = await hexoUtil.toHexoPostString(hexoPostObj);
    return fileUtil.writeFilePromise(filePath, hexoPostString, 'utf-8');
  }

  async _getBlogStatusEx(notePath) {
    const hexoRootPath = this.quihexConfig.getHexoRootPath();
    const tagsForSync = this.quihexConfig.getTagsForSync();

    const noteFile = await quiverUtil.loadNoteFile(notePath);
    const hexoPostObj = await quiverUtil.convertToHexoPostObj(noteFile);

    const hexoConfig = await hexoUtil.loadHexoConfig(hexoRootPath);

    // FIXME: maybe return class instance
    const createStatus = status => {
      return {
        hexoPostObj: hexoPostObj,
        status: status
      }
    };

    // if quihex note dose'nt have sync tag, skip sync it.
    if (arrUtil.extractDuplicateItems(hexoPostObj.tags.concat(tagsForSync)).length === 0) {
      return createStatus('skip');
    }

    const postsRoot = path.join(hexoRootPath, hexoConfig.source_dir, '_posts');
    const latestHexoBlogPath = path.join(postsRoot, `${hexoPostObj.filename}.md`);
    const existsLatestFile = await pathExists(latestHexoBlogPath);

    // set new status if last file is not-found
    if (!existsLatestFile) {
      return createStatus('new');
    }

    const latestHexoBlogFile = await fileUtil.readFilePromise(latestHexoBlogPath);
    const isEqual = latestHexoBlogFile === hexoUtil.toHexoPostString(hexoPostObj);
    return createStatus(isEqual ? 'stable' : 'update');
  }
}

/**
 * FIXME: load config in this class when methods are called
 * @param quihexConfig loaded config data
 * @returns {QuihexCore} core instance
 */
function createCore(quihexConfig) {
  return new QuihexCore(quihexConfig);
}

export default {
  createCore
};
