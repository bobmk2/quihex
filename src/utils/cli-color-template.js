import clc from 'cli-color';

export default {
  success: clc.green,
  warning: clc.yellow.bold,
  error: clc.red.bold,
  notice: clc.blue,
  script: clc.xterm(10).bgBlack,
  example: clc.bgBlack.blackBright
}