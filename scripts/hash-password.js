import { randomBytes, scryptSync } from 'node:crypto';
import { stdin, stdout } from 'node:process';

if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
  console.error('Run this utility in an interactive terminal so the password can be entered without echo.');
  process.exit(1);
}

function readHidden(prompt) {
  return new Promise((resolve) => {
    let password = '';
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk) => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') {
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\nCancelled.\n');
          process.exit(130);
        }
        if (char === '\r' || char === '\n') {
          stdin.off('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          return;
        }
        if (char === '\u007f' || char === '\b') password = password.slice(0, -1);
        else if (char >= ' ') password += char;
      }
    };
    stdin.on('data', onData);
  });
}

const password = await readHidden('Enter a unique admin password (minimum 14 characters): ');
if (password.length < 14) {
  console.error('Password must contain at least 14 characters.');
  process.exit(1);
}
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
stdout.write(`AUTH_PASSWORD_HASH=scrypt$${salt}$${hash}\n`);
