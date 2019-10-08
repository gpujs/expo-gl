# @gpujs/expo-gl - A GPU.js extender for use with React Native's Expo library

This package allows you to use [GPU.js](gpu.rocks) with Expo to get a native GPGPU.

## Installation
1. Setup Expo - https://docs.expo.io/versions/latest/introduction/installation/
2. Add the following to use `@gpujs/expo-gl`:
  ```js
    import { GLView } from 'expo-gl';
    import { GPU } from '@gpujs/expo-gl';
    GLView.createContextAsync()
      .then(context => {
        const gpu = new GPU({ context });
        const kernel = gpu.createKernel(kernelFunctionHere, kernelOptionsHere);
        kernel();
      });
  ```
3. Visit https://github.com/gpujs/gpu.js for documentation on `kernelFunctionHere`, `kernelOptionsHere`, as well as the api.
4. Run your expo from Android or iOS and have native GPGPU support!
5. Have fun!


## Example
```js
import { GLView } from 'expo-gl';
import { GPU } from '@gpujs/expo-gl';
GLView.createContextAsync()
  .then(context => {
    const gpu = new GPU({ context });
    const kernel = gpu.createKernel(function() {
      return 1;
    }, { output: [1], debug: true });
    console.log(kernel());
    gpu.destroy();
  });
```
