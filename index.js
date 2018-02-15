const path = require('path');
const {Thread} = require(path.join(__dirname, 'build', 'Release', 'child_process_thread.node'));
const RawBuffer = require('raw-buffer');
const smiggles = require('smiggles');

Thread.prototype.postMessage = function(m, arrayBuffer) {
  arrayBuffer = smiggles.serialize(m, arrayBuffer);
  new RawBuffer(arrayBuffer); // externalize
  this.postThreadMessage(arrayBuffer);
};
Thread.bind = bindings => smiggles.bind(bindings);

module.exports = Thread;
