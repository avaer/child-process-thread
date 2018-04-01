console.log('worker 1 1');

onmessage = m => {
  console.log('got thread message', m.data);
  postMessage(m);
};

console.log('tick 1', typeof tick);
tick();
console.log('tick 3');

let done = false;
process.nextTick(() => {
  done = true;
});
while (!done) {
  tick();
  console.log('check tick done', done);
}

console.log('tick 4');

setTimeout(() => {
  console.log('worker 2 1');
}, 100);
