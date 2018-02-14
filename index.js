const path = require('path');
const {Thread} = require(path.join(__dirname, 'build', 'Release', 'child_process_thread.node'));
module.exports = Thread;
