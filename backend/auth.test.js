import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';

process.env.SESSION_SECRET = randomBytes(32).toString('hex');
const { createSessionCookie, readSession, verifyPassword } = await import('./auth.js');

test('accepts a valid scrypt password and rejects an incorrect password', async () => {
  const salt = randomBytes(16).toString('hex');
  const password = 'correct horse battery staple 2026';
  const hash = scryptSync(password, salt, 64).toString('hex');
  assert.equal(await verifyPassword(password, `scrypt$${salt}$${hash}`), true);
  assert.equal(await verifyPassword('incorrect password', `scrypt$${salt}$${hash}`), false);
});

test('creates a signed session cookie and rejects a tampered cookie', () => {
  const cookie = createSessionCookie('admin');
  const value = cookie.split(';')[0];
  const session = readSession({ headers: { cookie: value } });
  assert.equal(session.sub, 'admin');
  assert.equal(session.role, 'admin');
  const tampered = value.replace(/.$/, value.endsWith('a') ? 'b' : 'a');
  assert.equal(readSession({ headers: { cookie: tampered } }), null);
});

test('rejects missing and malformed session cookies', () => {
  assert.equal(readSession({ headers: {} }), null);
  assert.equal(readSession({ headers: { cookie: 'usims_session=not-a-token' } }), null);
});
