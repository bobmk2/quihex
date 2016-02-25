import clct from './cli-color-template';

function display(header, msg) {
  var log = header;
  if (typeof msg !== 'undefined' && msg && msg.length > 0) {
    log += `: ${msg}`;
  }
  console.log(log);
}

export default {
  info: (msg) => {
    display(clct.notice('Info'), msg);
  },
  warning: (msg) => {
    display(clct.warning('Warning'), msg);
  },
  finish: (msg) => {
    display(clct.success('Finished'), msg);
  },
  error: (msg) => {
    display(clct.error('Error'), msg);
  },
  cancel: (msg) => {
    display(clct.notice('Canceled'), msg);
  },

  separator: (len, char = '-') => {
    console.log(Array(len + 1).join(char));
  }
}
