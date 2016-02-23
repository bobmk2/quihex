#!/usr/bin/env node

'use strict';
import prompt from 'prompt';
import command from 'commander';

import clc from 'cli-color';
import clct from './utils/cli-color-template';

import qcore from './quihex-core';
import qconfig from './quihex-config';

const _ex = (msg) => {
  return clct.example(`(ex. ${msg})`);
};

prompt.message = `${clct.notice('Input')}`;
prompt.delimiter = `${clc.white(': ')}`;

function onCancel() {
  console.log('\r\n--------');
  console.log(clct.notice('Canceled'));
  console.log('--------');
}

function onError(err) {
  console.log(`${clct.error('Error')}: ${err.message}`);
}

command
  .command('init')
  .action(() => {
    tryLoadConfig()
      .then((tryConfig) => {
        var config = tryConfig.exists ? tryConfig.data : null;
        if (config) {
          console.log('====================================');
          console.log(`${clct.warning('Warning')}: Already config file exists.`);
          console.log(`${clct.notice('Info')}: If you don't update config, Enter ${clc.bold('empty')} with nothing.`);
          console.log('====================================');
        }
        return inputQuiverLibPath(config)
          .then((quiverLibPath) => {
            return inputHexoRootPath(config)
              .then((hexoRootPath) => {
                return qcore.getAllNotebookMetaFiles(quiverLibPath)
                  .then((notebookMetaFiles) => {
                    return inputSyncNotebookName(config, notebookMetaFiles)
                      .then((syncNotebookName) => {
                        // Mt. Fuji 🗻🗻🗻
                        var selectedIndex = notebookMetaFiles.map((meta) => {return meta.name}).indexOf(syncNotebookName);
                        if (selectedIndex === -1) {
                          return Promise.reject(new Error(`Sync notebook name is not found. [${syncNotebookName}]`));
                        }
                        return qconfig.createConfigObj(quiverLibPath, hexoRootPath, notebookMetaFiles[selectedIndex]);
                      })
                      .then((configObj) => {
                        return qconfig.writeConfig(configObj);
                      });
                  });
              })
          })
      })
      .then(() => {
        console.log('----------------------------------------');
        console.log(`${clct.success('Finished')} :)`);
        console.log(`${clct.notice('Info')}: Config file path is ${clct.script(qconfig.getConfigFilePath())}`);
        console.log('----------------------------------------');
      })
      .catch((err) => {
        onError(err);
      });
  });

command
  .command('ls-notebook')
  .action(() => {
    qconfig.loadConfig()
      .then((config) => {
        return qcore.getUserNotebookNames(config);
      })
      .then((notebookNames) => {
        notebookNames.map((nb) => {
          console.log(`📗  ${nb}`);
        });
      })
      .catch((err) => {
        onError(err);
      });
  });

command
  .command('sync')
  .description('Sync quiver notes with hexo posts')
  .option('-y, --yes', 'Auto input yes')
  .option('-v, --verbose', 'Show all note status')
  .action((cmd) => {
    var yesOpt = cmd.yes ? true : false;
    var verboseOpt = cmd.verbose ? true : false;

    qconfig.loadConfig()
      .then((config) => {
        return qcore.getSyncNoteFilePaths(config)
          .then((notePaths) => {
            return qcore.getAllBlogStatus(config, notePaths);
          })
          .then((results) => {
            var statusColor = {
              skip: clct.skip,
              new: clct.new,
              update: clct.update,
              stable: clct.stable
            }

            results.forEach((result) => {
              var status = result.status;

              // if verbose option is not set, show only notes with update or new status.
              if (!verboseOpt && ['skip', 'stable'].indexOf(status) !== -1) {
                return;
              }

              console.log(statusColor[status](status.toUpperCase()) + " " + result.hexoPostObj.filename)
            });

            var syncPosts = results.filter((result) => {return ['update','new'].indexOf(result.status) !== -1}).map((post) => {return post.hexoPostObj});

            if (syncPosts.length === 0) {
              console.log(`${clct.notice('Info')}: Already up-to-date`);
              return;
            }

            // skip question if yes option is set
            return (yesOpt ? Promise.resolve(true) : inputYesNoConform('Do you sync quiver notes to hexo posts?'))
              .then((inputYes) => {
                if (!inputYes) {
                  console.log(`${clct.notice('Canceled')}: quiver notes are not synced.`);
                  return;
                }
                console.log(`${clct.notice('Info')}: Sync start...`);
                return Promise.all(
                  syncPosts.map((post) => {
                    return qcore.writeAsHexoPosts(config, post)
                  })
                )
                  .then((results) => {
                    console.log('----------------------------------------');
                    console.log(`${clct.success('Finished')}: sync succeed`);
                    console.log(`${clct.notice('Info')}: Check updated texts at hexo dir, and deploy them :)`)
                    console.log('----------------------------------------');
                  });
              })
          });
      })
      .catch((err) => {
        onError(err);
      });
  });

function tryLoadConfig() {
  return qconfig.loadConfig()
    .then((config) => {
      return Promise.resolve({exists: true, data: config});
    })
    .catch((err) => {
      console.log(err);
      return Promise.resolve({exists: false, data: null});
    });
}

function inputYesNoConform(description) {
  var question = {
    name: 'yesno',
    description: clct.question(`${description} [Y/n]`),
    message: 'Please input Y(Yes) or n(no)',
    type: 'string',
    required: true,
    conform: (input) => {
      return ['Y','Yes','n', 'no'].indexOf(input) !== -1;
    }
  }

  return input(question)
    .then((answer) => {
      var v = answer.yesno.trim();
      return Promise.resolve(['Y', 'Yes'].indexOf(v) !== -1);
    });
}

function inputQuiverLibPath(config) {
  var example = _ex('/Users/you/Library/Quiver.qvlibrary');

  var question = {
    name: 'quiver',
    description: clct.question(`${clc.bold('Quiver')} library path ${config ? '' : example}`),
    default: config ? config.quiver : undefined,
    message: 'Please input quiver lib path',
    type: 'string',
    required: true
  };

  return input(question)
    .then((answer) => {
      var quiverLibPath = answer.quiver.trim();
      return qcore.validQuiverLib(quiverLibPath)
        .then(() => {
          return Promise.resolve(quiverLibPath)
        })
    })
    .catch((err) => {
      onError(err);
      // FIXME: will happen stack over flow :(
      return inputQuiverLibPath(config)
    })
}

function inputHexoRootPath(config) {
  var example = _ex('/Users/you/hexo-blog');

  var question = {
    name: 'hexo',
    description: clct.question(`${clc.bold('Hexo')} root dir path ${config ? '' : example}`),
    default: config ? config.hexo : undefined,
    message: 'Please input hexo root path',
    type: 'string',
    required: true
  };

  return input(question)
    .then((answer) => {
      var hexoRootPath = answer.hexo.trim();
      return qcore.validHexoRoot(hexoRootPath)
        .then(() => {
          return Promise.resolve(hexoRootPath)
        })
    })
    .catch((err) => {
      onError(err);
      // FIXME: will happen stack over flow :(
      return inputHexoRootPath(config)
    })
}

function inputSyncNotebookName(config, notebookMetaFiles) {
  console.log('-----------------');
  console.log(' 📚  Notebooks    ');
  console.log('-----------------');

  notebookMetaFiles.map((nb) => {
    console.log(`📗  ${nb.name}`);
  });

  var example = _ex(notebookMetaFiles[0].name);

  var conformFunc = (inputName) => {
    return notebookMetaFiles.map((notebook) => {
        return notebook.name;
      }).indexOf(inputName) != -1;
  };

  var question = {
    name: 'syncNotebook',
    description: clct.question(`Notebook name for syncing to Hexo ${config ? '' : example}`),
    message: 'Please set the notebook name for sync',
    default: config && config.syncNotebook ? config.syncNotebook.name : undefined,
    type: 'string',
    required: true,
    conform: conformFunc
  };

  return input(question)
    .then((answer) => {
      var syncNotebook = answer.syncNotebook;
      return Promise.resolve(syncNotebook);
    })
    .catch((err) => {
      onError(err);
    });
}

function input(question) {
  return new Promise((resolve, reject) => {
    prompt.start();
    prompt.get(question, (err, answer) => {

      if (typeof answer === 'undefined') {
        onCancel();
        return;
      }
      if (err) {
        reject(err);
      }
      resolve(answer);
    });
  });
}

command.version('0.0.1').parse(process.argv);