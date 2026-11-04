import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
const COOKIE = 'usims_session';
const SESSION_SECONDS = 8 * 60 * 60;
const loginAttempts = new Map();

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}
function sign(value) {
  return createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('base64url');
}
function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}
export async function verifyPassword(password, encoded) {
  const [scheme, salt, expected] = String(encoded || '').split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const actual = await scrypt(password, salt, 64);
  return safeEqual(actual.toString('hex'), expected);
}
export function createSessionCookie(username, role = 'admin') {
  const payload = Buffer.from(JSON.stringify({ sub: username, role, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  const value = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function readSession(req) {
  const value = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value) return null;
  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra || !safeEqual(signature, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.sub && session.exp > Math.floor(Date.now() / 1000) ? session : null;
  } catch { return null; }
}
export function loginRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || now - current.started > 15 * 60 * 1000) {
    loginAttempts.set(key, { started: now, count: 1 });
    return next();
  }
  if (current.count >= 8) {
    res.setHeader('Retry-After', '900');
    return res.status(429).json({ ok: false, error: 'Too many login attempts. Try again in 15 minutes.' });
  }
  current.count += 1;
  next();
}
export function requireSession(req, res, next) {
  const session = readSession(req);
  if (!session) {
    clearCookie(res);
    return res.status(401).json({ ok: false, error: 'Authentication required.' });
  }
  req.user = session;
  next();
}
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ ok: false, error: 'Administrator access required.' });
  next();
}
export { clearCookie };
