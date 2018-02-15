const path = require('path');
const childProcessThread = require('.');
const RawBuffer = require('raw-buffer');
const smiggles = require('smiggles');

console.log('lol 0');

t1 = childProcessThread.fork(path.join(__dirname, 'example-worker1.js'));
t2 = childProcessThread.fork(path.join(__dirname, 'example-worker2.js'));

o = {
  float32Array: Float32Array.from([1.5, 2.5, 3.5]),
};

t1.postMessage(o);
t1.onmessage = m => {
  console.log('got main thread message', m);
};

setTimeout(() => {
  console.log('lol 3');

  t1.terminate();
  console.log('lol 4');
  t2.cancel();

  console.log('lol 5');

  // coerce thread destruction
  t1 = null;
  t2 = null;
  for (let i = 0; i < 1000; i++) {
    const x = {
      buffer: new ArrayBuffer(1024 * 1024),
    };
  }

  setTimeout(() => {
    console.log('lol 6');
  }, 1000);
}, 200);
