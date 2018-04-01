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

try {
  deasync(cb => {
    console.log('deasync 5');

    cb({lol: 'zol'});
  });
} catch(err) {
  console.log('deasync 6', err);
}

setTimeout(() => {
  console.log('worker 2 1');
}, 100);
