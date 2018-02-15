const {RawBuffer: {RawBuffer}} = imports;
const smiggles = require('smiggles');

smiggles.bind({RawBuffer});

console.log('lol 1', RawBuffer);

onthreadmessage = arrayBuffer => {
  const m = smiggles.deserialize(arrayBuffer);
  console.log('got thread message', m);

  const arrayBuffer2 = smiggles.serialize(m);
  new RawBuffer(arrayBuffer2); // externalize

  new RawBuffer(arrayBuffer).destroy();

  postThreadMessage(arrayBuffer2);
};

setTimeout(() => {
  console.log('lol 2');
}, 100);
