const path = require('path');
const childProcessThread = require('.');
const RawBuffer = require('raw-buffer');
const smiggles = require('smiggles');

childProcessThread.bind({RawBuffer});

t1 = childProcessThread.fork(path.join(__dirname, 'example-worker1.js'));
t2 = childProcessThread.fork(path.join(__dirname, 'example-worker2.js'));

o = {
  float32Array: Float32Array.from([1.5, 2.5, 3.5]),
};

t1.postMessage(o);

immediate = null;
_recurse = () => {
  const ms = t1.pollMessages();
  if (ms) {
    for (let i = 0; i < ms.length; i++) {
      const m = ms[i];
      console.log('got main thread message', m);
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
