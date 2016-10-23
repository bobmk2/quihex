#!/usr/bin/env node

'use strict';
import prompt from 'prompt';
import command from 'commander';
import clc from 'cli-color';

import qcore from './quihex-core';
import qconf from './quihex-config';

import logt from './utils/log-template';
import clct from './utils/cli-color-template';

const _ex = (msg) => {
  return clct.example(`(ex. ${msg})`);
};

prompt.message = `${clct.notice('Input')}`;
prompt.delimiter = `${clc.white(': ')}`;

function onCancel() {
  console.log('\r\n');
  logt.separator(8);
  logt.cancel();
  logt.separator(8);
}

function onError(err) {
  logt.error(err.message);
}

command
  .command('init')
  .description('Initialize or update quihex config')
  .action(() => {
    tryLoadConfig()
      .then((tryConfig) => {
        var config = tryConfig.exists ? tryConfig.data : null;
        if (config) {
          logt.separator(30, '=');
          logt.warning('Already config file exists.');
          logt.info('If you don\'t need to update config, Press enter with nothing.');
          logt.separator(30, '=');
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
                        var selectedIndex = notebookMetaFiles.map((meta) => {
                          return meta.name
                        }).indexOf(syncNotebookName);
                        if (selectedIndex === -1) {
                          return Promise.reject(new Error(`Sync notebook name is not found. [${syncNotebookName}]`));
                        }
                        return qconf.createConfigObj(quiverLibPath, hexoRootPath, notebookMetaFiles[selectedIndex], config && typeof config.tagsForSync !== 'undefined' ? config.tagsForSync : ['_sync_', '_blog_']);
                      })
                      .then((configObj) => {
                        return qconf.writeConfig(configObj);
                      });
                  });
              })
          })
          .then(confObj => {
            logt.separator(30);
            logt.finish(`Config file was ${config ? 'updated' : 'created'} :)`);
            logt.info(`path > ${clct.script(qconf._getConfigFilePath())}`);
            logt.info(`config json > \r\n${clct.script(JSON.stringify(confObj, null, 2))}`);
            logt.separator(30);
          });
      })
      .catch((err) => {
        onError(err);
      });
  });

command
  .command('ls-notebook')
  .description('Show user\'s quiver notebooks')
  .action(() => {
    qconf.loadValidatedConfig()
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

    qconf.loadValidatedConfig()
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

            var syncTargetPosts = results.filter((result) => {
              return ['update', 'new'].indexOf(result.status) !== -1
            }).map((post) => {
              return post.hexoPostObj
            });

            if (syncTargetPosts.length === 0) {
              logt.info('Already up-to-date');
              return;
            }

            // skip question if yes option is set
            return (yesOpt ? Promise.resolve(true) : inputYesNoConform('Do you sync quiver notes to hexo posts?'))
              .then((inputYes) => {
                if (!inputYes) {
                  logt.cancel('Quiver notes are not synced.');
                  return;
                }
                logt.separator(30);
                logt.info('Sync start...');
                return Promise.all(
                  syncTargetPosts.map((post) => {
                    return qcore.writeAsHexoPosts(config, post)
                      .then((result) => {
                        logt.info(`Success [${post.filename}]`)
                      });
                  })
                  )
                  .then(() => {
                    logt.separator(30);
                    logt.finish('Sync succeed');
                    logt.info('Check updated texts at hexo dir, and deploy them :)');
                    logt.separator(30);
                  });
              })
          });
      })
      .catch((err) => {
        onError(err);
      });
  });

function tryLoadConfig() {
  return qconf.loadConfigUnsafety()
    .then((config) => {
      return Promise.resolve({exists: true, data: config});
    })
    .catch((err) => {
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
      return ['Y', 'Yes', 'n', 'no'].indexOf(input) !== -1;
    }
  };

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
    default: config && typeof config.quiver !== 'undefined' ? config.quiver : undefined,
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
    default: config && typeof config.hexo !== 'undefined' ? config.hexo : undefined,
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
  logt.separator(18);
  console.log(' 📚  Notebooks 📚  ');
  logt.separator(18);

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
    default: config && typeof config.syncNotebook !== 'undefined' && typeof config.syncNotebook.name !== 'undefined' ? config.syncNotebook.name : undefined,
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

command
  .version('0.0.1')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  const logo = `   ____            _   _
  / __ \\          (_) | |
 | |  | |  _   _   _  | |__     ___  __  __
 | |  | | | | | | | | | '_ \\   / _ \\ \\ \\/ /
 | |__| | | |_| | | | | | | | |  __/  >  <
  \\___\\_\\  \\__,_| |_| |_| |_|  \\___| /_/\\_\\`;
  console.log(logo);
  command.outputHelp();
}
