const assert = require('assert');
const { GPU, ExpoGLKernel } = require('../');

// A stand-in for the context Expo's native side hands back. Only the surface
// this package inspects is implemented — enough to prove the wiring, not to run
// a shader. Anything that compiles GLSL needs a real device.
function fakeExpoContext(overrides = {}) {
  return Object.assign({
    endFrameEXP() {},
    flushEXP() {},
    createVertexArray() {},
    getExtension() { return null; },
    getParameter() { return 0; },
    getShaderPrecisionFormat() { return { rangeMin: 127, rangeMax: 127, precision: 23 }; },
  }, overrides);
}

describe('@gpujs/expo-gl', () => {
  afterEach(() => ExpoGLKernel.reset());

  describe('importing the package', () => {
    it('does not create a GL context', () => {
      // The previous release called GLView.createContextAsync() at module load,
      // which raced with isSupported, leaked the context and cost startup time
      // even when the app never used the GPU.
      assert.strictEqual(ExpoGLKernel.testContext, null);
      assert.strictEqual(ExpoGLKernel.features, null);
    });

    it('does not require expo-gl', () => {
      // expo-gl is a peer, not imported: requiring it here would break in any
      // environment where the native module is unavailable.
      const source = require('fs').readFileSync(require.resolve('../kernel.js'), 'utf8');
      assert.ok(!/require\(['"]expo-gl['"]\)/.test(source));
    });
  });

  describe('.isContextMatch()', () => {
    it('accepts an Expo WebGL2 context', () => {
      assert.strictEqual(ExpoGLKernel.isContextMatch(fakeExpoContext()), true);
    });

    it('rejects null and undefined', () => {
      assert.strictEqual(ExpoGLKernel.isContextMatch(null), false);
      assert.strictEqual(ExpoGLKernel.isContextMatch(undefined), false);
    });

    it('rejects a context that is not from Expo', () => {
      const webContext = fakeExpoContext({ endFrameEXP: undefined });
      assert.strictEqual(ExpoGLKernel.isContextMatch(webContext), false);
    });

    it('rejects an Expo WebGL1 context', () => {
      const gl1 = fakeExpoContext({ createVertexArray: undefined });
      assert.strictEqual(ExpoGLKernel.isContextMatch(gl1), false);
    });
  });

  describe('.setupWithContext()', () => {
    it('adopts a valid context', () => {
      assert.strictEqual(ExpoGLKernel.setupWithContext(fakeExpoContext()), true);
      assert.strictEqual(ExpoGLKernel.isSupported, true);
    });

    it('refuses an invalid one and stays unsupported', () => {
      assert.strictEqual(ExpoGLKernel.setupWithContext({}), false);
      assert.strictEqual(ExpoGLKernel.isSupported, false);
    });
  });

  describe('new GPU()', () => {
    it('explains what to do when no context is given', () => {
      assert.throws(() => new GPU(), /createContextAsync/);
    });

    it('explains when the context is not an Expo one', () => {
      assert.throws(() => new GPU({ context: {} }), /not an Expo WebGL2 context/);
    });

    it('reports WebGL2 support and not WebGL1', () => {
      assert.strictEqual(GPU.isWebGL2Supported, true);
      assert.strictEqual(GPU.isWebGLSupported, false);
    });
  });

  describe('.reset()', () => {
    it('forgets the adopted context', () => {
      ExpoGLKernel.setupWithContext(fakeExpoContext());
      assert.strictEqual(ExpoGLKernel.isSupported, true);
      ExpoGLKernel.reset();
      assert.strictEqual(ExpoGLKernel.testContext, null);
      assert.strictEqual(ExpoGLKernel.isSupported, false);
    });
  });
});
