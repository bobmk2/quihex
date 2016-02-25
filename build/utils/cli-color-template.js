'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cliColor = require('cli-color');

var _cliColor2 = _interopRequireDefault(_cliColor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  success: _cliColor2.default.green,
  warning: _cliColor2.default.yellow.bold,
  error: _cliColor2.default.red.bold,
  notice: _cliColor2.default.blue,
  question: _cliColor2.default.bgBlack.white,
  script: _cliColor2.default.xterm(10).bgBlack,
  example: _cliColor2.default.bgBlack.blackBright,

  new: _cliColor2.default.red,
  update: _cliColor2.default.green,
  stable: _cliColor2.default.blue,
  skip: _cliColor2.default.blackBright
};