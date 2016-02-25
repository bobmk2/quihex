import clc from 'cli-color';

export default {
  success: clc.green,
  warning: clc.yellow.bold,
  error: clc.red.bold,
  notice: clc.blue,
  question: clc.bgBlack.white,
  script: clc.xterm(10).bgBlack,
  example: clc.bgBlack.blackBright,

  new: clc.red,
  update: clc.green,
  stable: clc.blue,
  skip: clc.blackBright
}
