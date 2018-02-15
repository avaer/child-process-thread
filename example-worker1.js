const {RawBuffer: {RawBuffer}} = imports;

console.log('lol 1', RawBuffer);

onthreadmessage = d => {
  console.log('got thread message', d);
};

setTimeout(() => {
  console.log('lol 2');
}, 100);
