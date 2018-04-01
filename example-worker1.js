console.log('worker 1 1');

onmessage = m => {
  console.log('got thread message', m.data);
  postMessage(m);
};

console.log('deasync 1', typeof deasync);
deasync();
console.log('deasync 3');

let done = false;
process.nextTick(() => {
  done = true;
});
while (!done) {
  deasync();
  console.log('check async', done);
}

console.log('deasync 4');

setTimeout(() => {
  console.log('worker 2 1');
}, 100);
