console.log('worker 1 1');

onmessage = m => {
  console.log('got thread message', m.data);
  postMessage(m);
};

console.log('deasync 1', typeof deasync);
deasync(cb => {
  console.log('deasync 2', typeof cb);

  cb();

  console.log('deasync 3');
});
console.log('deasync 4');

setTimeout(() => {
  console.log('worker 2 1');
}, 100);
