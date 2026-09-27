const { spawn } = require('node:child_process');

const children = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit', env: process.env }),
  spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start'], { stdio: 'inherit', env: { ...process.env, PORT: process.env.CLIENT_PORT || '3000' }, shell: process.platform === 'win32' }),
];

function stop() {
  for (const child of children) child.kill();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
