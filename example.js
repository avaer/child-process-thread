const path = require('path');
const childProcessThread = require('.');

t1 = childProcessThread.fork(path.join(__dirname, 'example-worker1.js'));
t2 = childProcessThread.fork(path.join(__dirname, 'example-worker2.js'));

a = new ArrayBuffer(4 * 3);
new Float32Array(a).set(Float32Array.from([1.5, 2.5, 3.5]));
t1.postMessage(a);

setTimeout(() => {
  console.log('lol 3');

  t1.terminate();
  t2.cancel();

  console.log('lol 4');
}, 200);
