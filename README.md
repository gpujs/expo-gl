# @gpujs/expo-gl - A GPU.js extender for use with React Native's Expo library

This package allows you to use [GPU.js](gpu.rocks) like this:

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

Have fun!
