console.log('lol 1');

onmessage = m => {
  console.log('got thread message', m);
  postMessage(m);
};
setTimeout(() => {
  console.log('lol 2');
}, 100);
