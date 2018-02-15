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
  new RawBuffer(arrayBuffer); // externalize
  postThreadMessage(arrayBuffer);
};

// user code

console.log('lol 1', RawBuffer);
onmessage = m => {
  console.log('got thread message', m);
  postMessage(m);
};
setTimeout(() => {
  console.log('lol 2');
}, 100);
