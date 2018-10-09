const fs = require('fs');

const createRequest = (fds, cb, arg) => {
  {
    const b = Buffer.from(JSON.stringify({fn: cb.toString(), arg}), 'utf8');
    const bLength = Buffer.allocUnsafe(4);
    bLength.writeUInt32LE(b.length);
    fs.writeSync(fds[1], bLength);
    fs.writeSync(fds[1], b);
  }

  console.log('request write');

  const length = (() => {
    let total = 0;
    const b = Buffer.allocUnsafe(4);
    for (;;) {
      const bytesRead = fs.readSync(fds[0], b, total, 4, null);
      if (bytesRead > 0) {
        total += bytesRead;
      }
      if (total >= 4) {
        return b.readUInt32LE(0);
      }
    }
  })();

  console.log('request got length', length);
  
  const b = (() => {
    const b = Buffer.allocUnsafe(length);
    let total = 0;
    for (;;) {
      const bytesRead = fs.readSync(fds[0], b, total, length - total, null);
      if (bytesRead > 0) {
        total += bytesRead;
      }
      if (total >= length) {
        return b
      }
    }
  })();

  console.log('request got buffer', b.length);

  const s = b.toString('utf8');
  const j = JSON.parse(s);
  return j;
};

onmessage = m => {
  console.log('got thread message', m.data);
  const fds = m.data;
  const result = createRequest(fds, (x, cb) => {
    setTimeout(() => {
      console.log('tick', x);
      cb('ok');
    }, 1000);
  }, 7);
  console.log('tock', result);
};