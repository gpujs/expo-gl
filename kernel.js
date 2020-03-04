const { WebGL2Kernel } = require('gpu.js/src/backend/web-gl2/kernel');
const { GLView } = require('expo-gl');

let isSupported = null;
let testContext = null;
let testCanvas = {}; // not yet supported
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

  static get testContext() {
    return testContext;
  }

  static get testCanvas() {
    return testCanvas;
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
    const gl = this.testContext;
    return Object.freeze({
      isFloatRead: this.getIsFloatRead(),
      isIntegerDivisionAccurate: this.getIsIntegerDivisionAccurate(),
      kernelMap: true,
      isTextureFloat: true,
      channelCount: this.getChannelCount(),
      maxTextureSize: this.getMaxTextureSize(),
      lowIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT),
      lowFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT),
      mediumIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT),
      mediumFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT),
      highIntPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT),
      highFloatPrecision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),
    });
  }

  static getChannelCount() {
    return testContext.getParameter(testContext.MAX_DRAW_BUFFERS);
  }

  static getMaxTextureSize() {
    return testContext.getParameter(testContext.MAX_TEXTURE_SIZE);
  }

  static get features() {
    return features;
  }

  constructor(source, settings) {
    super(source, settings);
    this.warnVarUsage = false;
  }

  initContext() {
    throw new Error('No context defined and ExpoGL instantiates them asynchronously');
  }
  initCanvas() {
    return testCanvas;
  }
}

module.exports = {
  ExpoGLKernel
};
