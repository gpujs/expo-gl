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
    // gpu.js assigns settings.context before calling this, so the context the
    // application obtained from Expo is already available. Adopting it here is
    // what makes the kernel supported — this package never creates a context
    // of its own, since Expo's are asynchronous and expensive.
    if (this.context) {
      ExpoGLKernel.setupWithContext(this.context);
    }
    if (!ExpoGLKernel.isSupported) {
      throw new Error(
        this.context
          ? 'The given context is not an Expo WebGL2 context. Obtain one with GLView.createContextAsync(), or from a GLView\'s onContextCreate.'
          : 'No context was given. Expo creates GL contexts asynchronously:\n' +
            '  const context = await GLView.createContextAsync();\n' +
            '  const gpu = new GPU({ context });'
      );
    }
    return this.Kernel = ExpoGLKernel;
  }
}

module.exports = {
  GPU,
  ExpoGLKernel
};
