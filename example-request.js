const Thread = require('.');
const path = require('path');
const fs = require('fs');

const createHandler = fds => {
  const rs = fs.createReadStream(null, {fd: fds[0]});
  const _read1 = () => {
    const bs = [];
    let total = 0;
    const _data = d => {
      console.log('handler data', d.length);

      bs.push(d);
      total += d.length;
      if (total >= 4) {
        const b = Buffer.concat(bs);
        const b1 = b.slice(0, 4);
        const b2 = b.slice(4);

        const length = b1.readUInt32LE(0);

        rs.removeListener('data', _data);
        _read2(length);
        if (bs.length > 0) {
          rs.unshift(b2);
        }
      }
    };
    rs.on('data', _data);
  };
  const _read2 = length => {
    const bs = [];
    let total = 0;
    const _data = d => {
      bs.push(d);
      total += d.length;
      if (total >= length) {
        const b = Buffer.concat(bs);
        const b1 = b.slice(0, length);
        const b2 = b.slice(length);

        const s = b1.toString('utf8');
        const j = JSON.parse(s);
        const {fn: fnString, arg} = j;
        const fn = eval(fnString);
        fn(arg, result => {
          const b = Buffer.from(JSON.stringify(result), 'utf8');
          const bLength = Buffer.allocUnsafe(4);
          bLength.writeUInt32LE(b.length);
          fs.write(fds[1], bLength, err => {});
          fs.write(fds[1], b, err => {});
        });

        rs.removeListener('data', _data);
        _read1();
        if (bs.length > 0) {
          rs.unshift(b2);
        }
      }
    };
    rs.on('data', _data);
  };

  _read1();
};

const t1 = Thread.fork(path.join(__dirname, 'example-request-worker.js'));
const inFds = Thread.pipe();
const outFds = Thread.pipe();
t1.postMessage([outFds[0], inFds[1]]);
createHandler([inFds[0], outFds[1]]);
