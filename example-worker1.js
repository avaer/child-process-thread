const fetch = require('window-fetch');

console.log('worker 1 1');

onmessage = m => {
  console.log('got thread message', m.data);
  postMessage(m);
};

console.log('tick 1', typeof tick);
tick();
console.log('tick 3');

// let done = true;
let done = false;
fetch('http://www.google.ca/?gfe_rd=cr&amp;dcr=0&amp;ei=YODAWvytDu6fXuLLrOAI')
  .then(res => res.text())
  .then(s => {
    console.log('got res', s.length);
    done = true;
  })
  .catch(err => {
    console.warn(err.stack);
  });
/* process.nextTick(() => {
  done = true;
}); */
/* setTimeout(() => {
  done = true;
}, 100); */
while (!done) {
  tick();
  console.log('check tick done', done);
}

console.log('tick 4');

setTimeout(() => {
  console.log('worker 2 1');
}, 100);
