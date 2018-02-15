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
postMessage = (m, transferList) => {
  const arrayBuffer = smiggles.serialize(m, transferList);
  new RawBuffer(arrayBuffer).toAddress(); // externalize
  postThreadMessage(arrayBuffer);
};

// user code

console.log('booting', process.argv[2]);

require(process.argv[2]);
