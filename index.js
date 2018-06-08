const path = require('path');
const {Thread} = require(path.join(__dirname, 'build', 'Release', 'child_process_thread.node'));
const RawBuffer = require('raw-buffer');
const smiggles = require('smiggles');
const MessageEvent = require('./message-event');

function _getInfo({message, stack}) {
  const xs = (stack || '').split('\n    at ');
  if (xs.length > 1) {
    let x = ((/[(](.+)[)]/).exec(xs[1])||[])[1];
    if (x == null) {
      x = xs[1];
    }
    let [_, filename, lineno] = ((/(.+)[:]([0-9]+)[:]/).exec(x)||[]);
    if (lineno) {
      lineno = parseInt(lineno, 10);
      if (isNaN(lineno)) {
        lineno = null;
      }
    }
    return {message, filename, lineno};
  }
  return {message};
}

class ErrorEvent {
  constructor(e) {
    this.error = e;
    Object.assign(this, _getInfo(e));
  }
}

module.exports = MessageEvent;

smiggles.bind({RawBuffer});

const rawBufferSymbol = Symbol();

Thread.setChildJsPath(path.join(__dirname, 'child.js'));
Thread.setNativeRequire('RawBuffer', RawBuffer.initFunctionAddress);
Thread.prototype.postMessage = function(m, transferList, arrayBuffer) {
  arrayBuffer = smiggles.serialize(m, transferList, arrayBuffer);
  new RawBuffer(arrayBuffer).toAddress(); // externalize
  this.postThreadMessage(arrayBuffer);
};
Thread.prototype.onthreadmessage = function(arrayBuffer) {
  arrayBuffer[rawBufferSymbol] = new RawBuffer(arrayBuffer); // internalize

  if (this.onmessage) {
    const m = smiggles.deserialize(arrayBuffer);
    try {
      this.onmessage(new MessageEvent(m));
    }
    catch (e) {
      if (this.onerror) {
        this.onerror(new ErrorEvent(e));
      } else {
        console.warn('Unhandled error in web worker:');
        console.warn(e.message);
        console.warn(e.stack);
      }
    }
  }
};
Thread.bind = smiggles.bind;

module.exports = Thread;
