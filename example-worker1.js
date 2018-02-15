console.log('lol 1');

onthreadmessage = d => {
  console.log('got thread message', d);
};

setTimeout(() => {
  console.log('lol 2');
}, 100);
