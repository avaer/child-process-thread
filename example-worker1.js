const fetch = require('window-fetch');

console.log('worker 1 1');

onmessage = m => {
  console.log('got thread message', m.data);
  postMessage(m);
};

fetch('http://www.google.ca/?gfe_rd=cr&amp;dcr=0&amp;ei=YODAWvytDu6fXuLLrOAI')
  .then(res => res.text())
  .then(s => {
    console.log('got res', s.length);
  })
  .catch(err => {
    console.warn(err.stack);
  });

setTimeout(() => {
  console.log('worker 2 1');
}, 100);
