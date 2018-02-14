const path = require('path');
const childProcessThread = require('.');

t1 = childProcessThread.fork(path.join(__dirname, 'example-worker1.js'));
t2 = childProcessThread.fork(path.join(__dirname, 'example-worker2.js'));

setTimeout(() => {
  console.log('lol 3');

  t1.terminate();
  t2.cancel();

  console.log('lol 4');
}, 200);
