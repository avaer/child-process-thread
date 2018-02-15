const path = require('path');
const {Thread} = require(path.join(__dirname, 'build', 'Release', 'child_process_thread.node'));
const RawBuffer = require('raw-buffer');
const smiggles = require('smiggles');

const rawBufferSymbol = Symbol();

Thread.fork = (fork => function(jsPath, imports = {}) {
  imports['RawBuffer'] = RawBuffer.initFunctionAddress;
  return fork.call(this, jsPath, imports);
})(Thread.fork);
Thread.setChildJsPath(path.join(__dirname, 'child.js'));
Thread.prototype.postMessage = function(m, arrayBuffer) {
  arrayBuffer = smiggles.serialize(m, arrayBuffer);
  new RawBuffer(arrayBuffer).toAddress(); // externalize
  this.postThreadMessage(arrayBuffer);
};
Thread.prototype.pollMessages = function() {
  let ms;

  const arrayBuffers = this.pollThreadMessages();
  if (arrayBuffers) {
    ms = Array(arrayBuffers.length);

    for (let i = 0; i < arrayBuffers.length; i++) {
      const arrayBuffer = arrayBuffers[i];
      arrayBuffer[rawBufferSymbol] = new RawBuffer(arrayBuffer); // internalize

      const m = smiggles.deserialize(arrayBuffer);
      ms[i] = m;
    }
  }
  return ms;
};
Thread.bind = bindings => smiggles.bind(bindings);

module.exports = Thread;
