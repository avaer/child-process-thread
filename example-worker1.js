console.log('worker 1 1');

onmessage = m => {
  console.log('got thread message', m.data);
  postMessage(m);
};
setTimeout(() => {
  console.log('worker 2 1');
}, 100);
