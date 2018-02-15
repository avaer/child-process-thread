const path = require('path');
const childProcessThread = require('.');
const RawBuffer = require('raw-buffer');

t1 = childProcessThread.fork(path.join(__dirname, 'example-worker1.js'), {
  RawBuffer: RawBuffer.initFunctionAddress,
});
t2 = childProcessThread.fork(path.join(__dirname, 'example-worker2.js'), {
  RawBuffer: RawBuffer.initFunctionAddress,
});

o = {
  float32Array: Float32Array.from([1.5, 2.5, 3.5]),
};

t1.postMessage(o);

setTimeout(() => {
  console.log('lol 3');

  t1.terminate();
  t2.cancel();

  console.log('lol 4');
}, 200);
