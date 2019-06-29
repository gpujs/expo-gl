const { WebGL2Kernel } = require('./node_modules/gpu.js/src/backend/web-gl2/kernel');
const { GLView } = require('expo-gl');

let isSupported = null;
let testContext = null;
let testExtensions = null;
let features = null;

GLView.createContextAsync()
  .then(context => testContext = context);

class ExpoGLKernel extends WebGL2Kernel {
  static get isSupported() {
    if (isSupported !== null) {
      return isSupported;
    }
    this.setupFeatureChecks();
    isSupported = this.isContextMatch(testContext);
    return isSupported;
  }
  static setupFeatureChecks() {
    if (!testContext || !testContext.getExtension) return;
    testExtensions = {
      EXT_color_buffer_float: testContext.getExtension('EXT_color_buffer_float'),
      OES_texture_float_linear: testContext.getExtension('OES_texture_float_linear'),
    };
    features = this.getFeatures();
  }

  static getFeatures() {
    return Object.freeze({
      isFloatRead: this.getIsFloatRead(),
      isIntegerDivisionAccurate: this.getIsIntegerDivisionAccurate(),
      kernelMap: true,
      isTextureFloat: true,
      channelCount: this.getChannelCount(),
    });
  }

  static getChannelCount() {
    return testContext.getParameter(testContext.MAX_DRAW_BUFFERS);
  }

  static get features() {
    return features;
  }

  initContext() {
    return testContext;
  }
  initCanvas() {
    return {};
  }
}

module.exports = {
  ExpoGLKernel
};
