const path = require('path');
const childProcessThread = require('.');

childProcessThread.fork(path.join(__dirname, 'example-worker.js'));

setTimeout(() => {
  console.log('lol 3');
}, 200);
