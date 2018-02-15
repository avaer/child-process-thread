const path = require('path');
const childProcessThread = require('.');
const RawBuffer = require('raw-buffer');
const smiggles = require('smiggles');

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

immediate = null;
_recurse = () => {
  const arrayBuffers = t1.pollThreadMessages();
  if (arrayBuffers) {
    for (let i = 0; i < arrayBuffers.length; i++) {
      const arrayBuffer = arrayBuffers[i];
      const m = smiggles.deserialize(arrayBuffer);
      console.log('got main thread message', m);

      new RawBuffer(arrayBuffer).destroy();
    }
  } else {
    immediate = setImmediate(_recurse);
  }
};
_recurse();

setTimeout(() => {
  console.log('lol 3');

  t1.terminate();
  t2.cancel();

  console.log('lol 4');
}, 200);
