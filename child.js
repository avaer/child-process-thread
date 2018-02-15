const {RawBuffer: {RawBuffer}} = imports;
const smiggles = require('smiggles');

smiggles.bind({RawBuffer});

const rawBufferSymbol = Symbol();

onthreadmessage = arrayBuffer => {
  arrayBuffer[rawBufferSymbol] = new RawBuffer(arrayBuffer); // internalize

  if (onmessage !== null) {
    const m = smiggles.deserialize(arrayBuffer);
    onmessage(m);
  }
};
onmessage = null;
postMessage = function(m, transferList, arrayBuffer) {
  arrayBuffer = smiggles.serialize(m, transferList, arrayBuffer);
  new RawBuffer(arrayBuffer).toAddress(); // externalize
  postThreadMessage(arrayBuffer);
};

// user code

require(process.argv[2]);
