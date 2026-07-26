# @gpujs/expo-gl

[![CI](https://github.com/gpujs/expo-gl/actions/workflows/ci.yml/badge.svg)](https://github.com/gpujs/expo-gl/actions/workflows/ci.yml)

Use [GPU.js](https://gpu.rocks) for native GPGPU in Expo / React Native, on top of
[`expo-gl`](https://docs.expo.dev/versions/latest/sdk/gl-view/).

## Installation

```sh
npx expo install expo-gl
npm install gpu.js @gpujs/expo-gl
```

`expo-gl` and `gpu.js` are peer dependencies, so your app controls their
versions. This package adds no dependencies of its own.

## Usage

Expo creates GL contexts asynchronously, so obtain one and hand it to `GPU`.
**Write kernels as strings, not functions** — see below.

```js
import { GLView } from 'expo-gl';
import { GPU } from '@gpujs/expo-gl';

const context = await GLView.createContextAsync();
const gpu = new GPU({ context });

const kernel = gpu.createKernel(`function kernelFunction(a, b) {
  return a[this.thread.x] + b[this.thread.x];
}`).setOutput([3]);

kernel([1, 2, 3], [4, 5, 6]); // Float32Array [5, 7, 9]
```

### Kernels must be strings

React Native runs on Hermes, which discards function source. Calling
`toString()` on a function returns a placeholder:

```js
function add(a, b) { return a + b; }
add.toString(); // "function add(a0, a1) { [bytecode] }"
```

GPU.js compiles a kernel by reading its source, so a kernel passed as a
function cannot work here — it fails with `Identifier is not defined on line 1`.
Strings are unaffected, and GPU.js accepts them everywhere it accepts a
function, including `addFunction()`.

This is not a limitation of this package and cannot be worked around from it:
Hermes is the only engine Expo ships as of SDK 53, so there is no engine to
switch to.

A context from a rendered `<GLView onContextCreate={...} />` works equally well.

Everything else — kernel settings, textures, `createKernelMap` — is plain
GPU.js; see the [GPU.js documentation](https://github.com/gpujs/gpu.js), keeping
in mind that any kernel or added function must be given as a string.

### Releasing the context

A headless context from `createContextAsync()` is yours to clean up:

```js
import { ExpoGLKernel } from '@gpujs/expo-gl';

await GLView.destroyContextAsync(context);
ExpoGLKernel.reset(); // forget it, so a later context is picked up
```

## Requirements

- A WebGL2-capable Expo GL context. `expo-gl` provides one on iOS and Android;
  this package is not for web, where GPU.js runs directly.
- A real device or simulator. There is no Node implementation of Expo's GL, so
  kernels cannot run under test — CI covers wiring only.

## Notes

This package never creates a context of its own. Contexts are asynchronous and
expensive, and creating one at import time — as versions before 1.0.0 did —
raced with support detection, leaked the context, and cost startup time in apps
that never touched the GPU. Feature detection is likewise deferred until
something asks for it, since it compiles and runs a probe kernel.

Expo's contexts come from the native side and are not instances of any
`WebGL2RenderingContext` class, which React Native does not define, so this
package recognises them structurally rather than with `instanceof`.
