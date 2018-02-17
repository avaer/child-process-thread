const path = require('path');
const {Thread} = require(path.join(__dirname, 'build', 'Release', 'child_process_thread.node'));
const RawBuffer = require('raw-buffer');
const smiggles = require('smiggles');
const MessageEvent = require('./message-event');

smiggles.bind({RawBuffer});

const rawBufferSymbol = Symbol();

Thread.fork = (fork => function(jsPath, imports = {}) {
  imports['RawBuffer'] = RawBuffer.initFunctionAddress;
  return fork.call(this, jsPath, imports);
})(Thread.fork);
Thread.setChildJsPath(path.join(__dirname, 'child.js'));
Thread.prototype.postMessage = function(m, transferList, arrayBuffer) {
  arrayBuffer = smiggles.serialize(m, transferList, arrayBuffer);
  new RawBuffer(arrayBuffer).toAddress(); // externalize
  this.postThreadMessage(arrayBuffer);
};
Thread.prototype.onthreadmessage = function(arrayBuffer) {
  arrayBuffer[rawBufferSymbol] = new RawBuffer(arrayBuffer); // internalize

  if (this.onmessage) {
    const m = smiggles.deserialize(arrayBuffer);
    this.onmessage(new MessageEvent(m));
  }
};
Thread.bind = bindings => smiggles.bind(bindings);

module.exports = Thread;
