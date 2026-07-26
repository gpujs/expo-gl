const { WebGL2Kernel } = require('gpu.js/src/backend/web-gl2/kernel');

let isSupported = null;
let testContext = null;
let testExtensions = null;
let features = null;
// Expo has no canvas. gpu.js only ever hands this back to us, so an empty
// object is enough to satisfy the base class.
const testCanvas = {};

class ExpoGLKernel extends WebGL2Kernel {
  /**
   * Expo hands out contexts created on the native side (they live in
   * `global.__EXGLContexts`), so they are not instances of any
   * `WebGL2RenderingContext` class — React Native does not define one. The
   * inherited check tests exactly that and so always fails here; recognise the
   * context structurally instead. `endFrameEXP` is Expo's own marker, and
   * `createVertexArray` distinguishes WebGL2 from WebGL1.
   * @param {ExpoWebGLRenderingContext} context
   * @returns {Boolean}
   */
  static isContextMatch(context) {
    if (!context) return false;
    return typeof context.endFrameEXP === 'function'
      && typeof context.createVertexArray === 'function';
  }

  /**
   * @desc Adopt a context from `GLView.createContextAsync()` (or a `GLView`'s
   * `onContextCreate`) and detect its features.
   *
   * Contexts are asynchronous and expensive, so this package never creates one
   * of its own — it uses the one the application already has. `new GPU({
   * context })` calls this for you.
   * @param {ExpoWebGLRenderingContext} context
   * @returns {Boolean} whether the context was usable
   */
  static setupWithContext(context) {
    if (!this.isContextMatch(context)) return false;
    if (testContext !== context) {
      testContext = context;
      // detecting features compiles and runs a probe kernel, so leave it until
      // something actually asks for them rather than doing it in the GPU
      // constructor
      features = null;
      testExtensions = null;
    }
    isSupported = true;
    return true;
  }

  static get isSupported() {
    if (isSupported !== null) return isSupported;
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

  /**
   * React Native runs on Hermes, which discards function source: calling
   * toString() on a function returns "function name(a0, a1) { [bytecode] }".
   * GPU.js is a source transpiler, so the probe it inherits — which builds a
   * kernel from kernelFunction.toString() — parses that placeholder and fails
   * with "Identifier is not defined". The same probe written as a string
   * source works, because strings survive Hermes untouched.
   * @returns {Boolean}
   */
  static getIsIntegerDivisionAccurate() {
    const kernel = new this(
      'function kernelFunction(v1, v2) { return v1[this.thread.x] / v2[this.thread.x]; }',
      {
        context: this.testContext,
        canvas: this.testCanvas,
        validate: false,
        output: [2],
        returnType: 'Number',
        precision: 'unsigned',
        tactic: 'speed',
      }
    );
    const args = [
      [6, 6030401],
      [3, 3991]
    ];
    kernel.build.apply(kernel, args);
    kernel.run.apply(kernel, args);
    const result = kernel.renderOutput();
    kernel.destroy(true);
    return result[0] === 2 && result[1] === 1511;
  }

  static getChannelCount() {
    return testContext.getParameter(testContext.MAX_DRAW_BUFFERS);
  }

  static getMaxTextureSize() {
    return testContext.getParameter(testContext.MAX_TEXTURE_SIZE);
  }

  static get features() {
    if (!features && testContext) {
      this.setupFeatureChecks();
    }
    return features;
  }

  /**
   * @desc Forget the adopted context. Call after `GLView.destroyContextAsync()`
   * if another context will be created.
   */
  static reset() {
    testContext = null;
    testExtensions = null;
    features = null;
    isSupported = null;
  }

  constructor(source, settings) {
    super(source, settings);
    this.warnVarUsage = false;
  }

  initContext() {
    throw new Error(
      'No context was given. Expo creates GL contexts asynchronously, so pass one in:\n' +
      '  const context = await GLView.createContextAsync();\n' +
      '  const gpu = new GPU({ context });'
    );
  }

  initCanvas() {
    return testCanvas;
  }
}

module.exports = {
  ExpoGLKernel
};
