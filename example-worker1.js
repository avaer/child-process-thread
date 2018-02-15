const {RawBuffer: {RawBuffer}} = imports;
const smiggles = require('smiggles');

console.log('lol 1', RawBuffer);

onthreadmessage = arrayBuffer => {
  const m = smiggles.deserialize(arrayBuffer);

  console.log('got thread message', m);

  new RawBuffer(arrayBuffer).destroy();
};

setTimeout(() => {
  console.log('lol 2');
}, 100);
