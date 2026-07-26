import { GPU as GPUBase, IGPUSettings, WebGL2Kernel } from 'gpu.js';

export * from 'gpu.js';

/**
 * A GPU.js kernel backed by an Expo GL context.
 */
export class ExpoGLKernel extends WebGL2Kernel {
  /** Recognises a context from `GLView.createContextAsync()` or `onContextCreate`. */
  static isContextMatch(context: any): boolean;
  /** Adopts a context; returns whether it was usable. `new GPU({ context })` calls this. */
  static setupWithContext(context: any): boolean;
  /** Forgets the adopted context, e.g. after `GLView.destroyContextAsync()`. */
  static reset(): void;
}

/**
 * GPU.js bound to Expo's GL. Requires a context, since Expo creates them
 * asynchronously:
 *
 * ```ts
 * const context = await GLView.createContextAsync();
 * const gpu = new GPU({ context });
 * ```
 */
export class GPU extends GPUBase {
  constructor(settings: IGPUSettings & { context: any });
}
