const { GPU: GPUBase } = require('gpu.js');
const { ExpoGLKernel } = require('./kernel');

class GPU extends GPUBase {
  static get isWebGL2Supported() {
    return true;
  }
  static get isWebGLSupported() {
    return false;
  }
  chooseKernel() {
    if (!ExpoGLKernel.isSupported) {
      throw new Error('ExpoGLKernel kernel is not supported');
    }
    return ExpoGLKernel;
  }
}

module.exports = {
  GPU
};
