const path = require('path');
const {Thread} = require(path.join(__dirname, 'build', 'Release', 'child_process_thread.node'));
const RawBuffer = require('raw-buffer');
const smiggles = require('smiggles');

const rawBufferSymbol = Symbol();

Thread.setChildJsPath(path.join(__dirname, 'child.js'));
Thread.prototype.postMessage = function(m, arrayBuffer) {
  arrayBuffer = smiggles.serialize(m, arrayBuffer);
  new RawBuffer(arrayBuffer).toAddress(); // externalize
  this.postThreadMessage(arrayBuffer);
};
Thread.prototype.pollMessages = function() {
  const ms = this.pollThreadMessages();
  if (ms) {
    for (let i = 0; i < ms.length; i++) {
      const m = ms[i];
      m[rawBufferSymbol] = new RawBuffer(m); // internalize
    }
  }
  return ms;
};
Thread.bind = bindings => smiggles.bind(bindings);

module.exports = Thread;
