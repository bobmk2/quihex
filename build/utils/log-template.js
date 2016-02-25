'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cliColorTemplate = require('./cli-color-template');

var _cliColorTemplate2 = _interopRequireDefault(_cliColorTemplate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function display(header, msg) {
  var log = header;
  if (typeof msg !== 'undefined' && msg && msg.length > 0) {
    log += ': ' + msg;
  }
  console.log(log);
}

exports.default = {
  info: function info(msg) {
    display(_cliColorTemplate2.default.notice('Info'), msg);
  },
  warning: function warning(msg) {
    display(_cliColorTemplate2.default.warning('Warning'), msg);
  },
  finish: function finish(msg) {
    display(_cliColorTemplate2.default.success('Finished'), msg);
  },
  error: function error(msg) {
    display(_cliColorTemplate2.default.error('Error'), msg);
  },
  cancel: function cancel(msg) {
    display(_cliColorTemplate2.default.notice('Canceled'), msg);
  },

  separator: function separator(len) {
    var char = arguments.length <= 1 || arguments[1] === undefined ? '-' : arguments[1];

    console.log(Array(len + 1).join(char));
  }
};