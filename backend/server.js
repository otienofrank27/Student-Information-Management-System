import express from 'express';
import cors from 'cors';
import pool, { query, call, adminPool } from './db.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearCookie, createSessionCookie, apiRateLimit, loginRateLimit, readSession, requireAdmin, requireSession, verifyPassword } from './auth.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.resolve(__dirname, '../backups');
const PORT = Number(process.env.PORT || 3001);

const app = express();
app.disable('x-powered-by');
const allowedOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: allowedOrigin ? allowedOrigin.split(',').map(value => value.trim()).filter(Boolean) : false,
  credentials: true
}));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json({ limit: '32kb' }));

if (!process.env.AUTH_USERNAME || !process.env.AUTH_PASSWORD_HASH || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('Set AUTH_USERNAME, a generated scrypt AUTH_PASSWORD_HASH, and a random SESSION_SECRET of at least 32 characters.');
}
if (!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(process.env.AUTH_PASSWORD_HASH) || process.env.SESSION_SECRET.startsWith('REPLACE_')) {
  throw new Error('AUTH_PASSWORD_HASH or SESSION_SECRET still contains an invalid placeholder value.');
}

app.post('/api/auth/login', loginRateLimit, async (req, res) => {
  try {
    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');
    if (username !== process.env.AUTH_USERNAME || !(await verifyPassword(password, process.env.AUTH_PASSWORD_HASH))) {
      return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
    }
    res.setHeader('Set-Cookie', createSessionCookie(username, 'admin'));
    res.json({ ok: true, user: { username, role: 'admin' } });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ ok: false, error: 'Unable to sign in.' });
  }
});

app.get('/api/auth/session', (req, res) => {
  const user = readSession(req);
  if (!user) return res.status(401).json({ ok: false, error: 'Authentication required.' });
  res.json({ ok: true, user: { username: user.sub, role: user.role } });
});

app.post('/api/auth/logout', (_req, res) => {
  clearCookie(res);
  res.json({ ok: true });
});

app.use('/api', apiRateLimit, (req, res, next) => {
  if (req.path === '/health' || req.path === '/auth/login' || req.path === '/auth/session' || req.path === '/auth/logout') return next();
  return requireSession(req, res, next);
});

function sendError(res, err) {
  console.error('API operation failed:', err);
  const status = err.statusCode || 500;
  res.status(status).json({ ok: false, error: status < 500 ? (err.publicMessage || 'Request could not be completed.') : 'An internal server error occurred.' });
}

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ ok: true, database: 'usims' });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/dashboard', async (_req, res) => {
  try {
    const stats = await call('sp_dashboard_stats');
    const recentStudents = await query(
      `SELECT student_id, student_number, first_name, last_name, status, enrollment_date
       FROM students ORDER BY created_at DESC LIMIT 5`
    );
    const recentPayments = await query(
      `SELECT f.payment_id, f.amount, f.payment_date, f.status, f.receipt_number,
              s.student_number, s.first_name, s.last_name
       FROM fees f JOIN students s ON s.student_id = f.student_id
       ORDER BY f.payment_date DESC, f.payment_id DESC LIMIT 6`
    );
    const byDepartment = await query(
      `SELECT d.department_code, d.department_name, d.faculty,
              COUNT(s.student_id) AS student_count
       FROM departments d
       LEFT JOIN students s ON s.department_id = d.department_id AND s.status = 'Active'
       GROUP BY d.department_id, d.department_code, d.department_name, d.faculty
       ORDER BY student_count DESC, d.department_name`
    );
    const gradeDistribution = await query(
      `SELECT grade, COUNT(*) AS total
       FROM examinations
       GROUP BY grade
       ORDER BY FIELD(grade, 'A', 'B', 'C', 'D', 'F')`
    );
    const topCourses = await query(
      `SELECT course_code, course_name, enrolled_count, lecturer_name, department_name
       FROM vw_course_enrolment
       ORDER BY enrolled_count DESC, course_code
       LIMIT 6`
    );
    const feeMethods = await query(
      `SELECT payment_method, COUNT(*) AS total, COALESCE(SUM(amount), 0) AS amount
       FROM fees WHERE status = 'Paid'
       GROUP BY payment_method
       ORDER BY amount DESC`
    );
    const byCredential = await query(
      `SELECT credential_level, COUNT(*) AS total
       FROM courses
       GROUP BY credential_level
       ORDER BY FIELD(credential_level, 'Certificate', 'Diploma', 'Advanced Diploma', 'Bachelor', 'Master', 'Doctorate')`
    );
    const bySchool = await query(
      `SELECT d.faculty, COUNT(c.course_id) AS programme_count
       FROM departments d
       LEFT JOIN courses c ON c.department_id = d.department_id
       GROUP BY d.faculty
       ORDER BY d.faculty`
    );
    res.json({
      ok: true,
      stats: stats[0],
      recentStudents,
      recentPayments,
      byDepartment,
      gradeDistribution,
      topCourses,
      feeMethods,
      byCredential,
      bySchool
    });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/departments', async (_req, res) => {
  try {
    const rows = await query(
      'SELECT department_id, department_code, department_name, faculty FROM departments ORDER BY department_name'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/lecturers', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT l.lecturer_id, l.staff_number, l.first_name, l.last_name, l.email,
              l.title, l.department_id, d.department_name
       FROM lecturers l JOIN departments d ON d.department_id = l.department_id
       ORDER BY l.last_name`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const q = String(req.query.q || '');
    const data = await call('sp_get_student_details', [q]);
    res.json({ ok: true, data });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const rows = await query(
      `SELECT s.*, d.department_code, d.department_name, d.faculty
       FROM students s JOIN departments d ON d.department_id = s.department_id
       WHERE s.student_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Student not found' });
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/students', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const b = req.body;
    await conn.query('SET @new_id = NULL');
    await conn.query(
      'CALL sp_register_student(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @new_id)',
      [
        b.student_number, b.first_name, b.last_name, b.email, b.phone || null,
        b.date_of_birth, b.gender, b.address || null, b.department_id, b.enrollment_date
      ]
    );
    const [out] = await conn.query('SELECT @new_id AS id');
    res.status(201).json({ ok: true, id: out[0].id });
  } catch (err) {
    sendError(res, err);
  } finally {
    conn.release();
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const b = req.body;
    await call('sp_update_student', [
      req.params.id, b.first_name, b.last_name, b.email, b.phone || null,
      b.date_of_birth, b.gender, b.address || null, b.department_id, b.status
    ]);
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const school = String(req.query.school || '');
    const level = String(req.query.level || '');
    const params = [];
    let where = '';
    if (school) {
      where += ' AND d.faculty = ?';
      params.push(school);
    }
    if (level) {
      where += ' AND c.credential_level = ?';
      params.push(level);
    }
    const rows = await query(
      `SELECT c.*, d.department_name, d.faculty,
              CONCAT(l.first_name, ' ', l.last_name) AS lecturer_name
       FROM courses c
       JOIN departments d ON d.department_id = c.department_id
       LEFT JOIN lecturers l ON l.lecturer_id = c.lecturer_id
       WHERE 1=1 ${where}
       ORDER BY FIELD(c.credential_level, 'Certificate', 'Diploma', 'Advanced Diploma', 'Bachelor', 'Master', 'Doctorate'),
                d.faculty, c.course_name`
    , params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const b = req.body;
    const result = await query(
      `INSERT INTO courses (course_code, course_name, credits, credential_level, department_id, lecturer_id, semester, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.course_code, b.course_name, b.credits, b.credential_level || 'Bachelor', b.department_id, b.lecturer_id || null, b.semester, b.academic_year]
    );
    res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    sendError(res, err);
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const b = req.body;
    await query(
      `UPDATE courses SET course_code=?, course_name=?, credits=?, credential_level=?, department_id=?,
              lecturer_id=?, semester=?, academic_year=? WHERE course_id=?`,
      [b.course_code, b.course_name, b.credits, b.credential_level || 'Bachelor', b.department_id, b.lecturer_id || null,
       b.semester, b.academic_year, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/registrations', async (req, res) => {
  try {
    const studentId = req.query.student_id;
    const sql = `
      SELECT r.registration_id, r.student_id, r.course_id, r.registration_date, r.status,
             s.student_number, s.first_name, s.last_name,
             c.course_code, c.course_name, c.credits, c.academic_year, c.semester
      FROM registrations r
      JOIN students s ON s.student_id = r.student_id
      JOIN courses c ON c.course_id = r.course_id
      ${studentId ? 'WHERE r.student_id = ?' : ''}
      ORDER BY r.registration_date DESC, r.registration_id DESC`;
    const rows = await query(sql, studentId ? [studentId] : []);
    res.json({ ok: true, data: rows });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/registrations', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { student_id, course_id } = req.body;
    await conn.query('SET @new_id = NULL');
    await conn.query('CALL sp_register_course(?, ?, @new_id)', [student_id, course_id]);
    const [out] = await conn.query('SELECT @new_id AS id');
    res.status(201).json({ ok: true, id: out[0].id });
  } catch (err) {
    sendError(res, err);
  } finally {
    conn.release();
  }
});

app.patch('/api/registrations/:id', async (req, res) => {
  try {
    await query('UPDATE registrations SET status = ? WHERE registration_id = ?', [
      req.body.status, req.params.id
    ]);
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/examinations', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM vw_student_exam_results ORDER BY exam_date DESC, student_number');
    res.json({ ok: true, data: rows });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/examinations', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const b = req.body;
    await conn.query('SET @new_id = NULL');
    await conn.query('CALL sp_record_exam(?, ?, ?, ?, ?, @new_id)', [
      b.registration_id, b.exam_type, b.marks, b.exam_date, b.remarks || null
    ]);
    const [out] = await conn.query('SELECT @new_id AS id');
    res.status(201).json({ ok: true, id: out[0].id });
  } catch (err) {
    sendError(res, err);
  } finally {
    conn.release();
  }
});

app.get('/api/fees', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT f.*, s.student_number, s.first_name, s.last_name
       FROM fees f JOIN students s ON s.student_id = f.student_id
       ORDER BY f.payment_date DESC, f.payment_id DESC`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/fees/summary', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT * FROM vw_student_fee_summary
       WHERE academic_year IS NOT NULL
       ORDER BY student_number, academic_year, semester`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/fees', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const b = req.body;
    await conn.query('SET @new_id = NULL');
    await conn.query('CALL sp_record_payment(?, ?, ?, ?, ?, ?, ?, @new_id)', [
      b.student_id, b.amount, b.payment_date, b.payment_method,
      b.academic_year, b.semester, b.status || 'Paid'
    ]);
    const [out] = await conn.query('SELECT @new_id AS id');
    res.status(201).json({ ok: true, id: out[0].id });
  } catch (err) {
    sendError(res, err);
  } finally {
    conn.release();
  }
});

app.get('/api/admin/objects', requireAdmin, async (_req, res) => {
  try {
    const [tables] = await adminPool.query(
      `SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_ROWS, TABLE_COMMENT
       FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'usims' ORDER BY TABLE_TYPE, TABLE_NAME`
    );
    const [indexes] = await adminPool.query(
      `SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns, NON_UNIQUE
       FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'usims'
       GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE ORDER BY TABLE_NAME, INDEX_NAME`
    );
    const [routines] = await adminPool.query(
      `SELECT ROUTINE_NAME, ROUTINE_TYPE FROM information_schema.ROUTINES
       WHERE ROUTINE_SCHEMA = 'usims' ORDER BY ROUTINE_TYPE, ROUTINE_NAME`
    );
    const [triggers] = await adminPool.query(
      `SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
       FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'usims'`
    );
    const [users] = await adminPool.query(
      `SELECT User, Host FROM mysql.user WHERE User LIKE 'sims_%' ORDER BY User`
    );
    const grants = [];
    for (const u of users) {
      const [g] = await adminPool.query(`SHOW GRANTS FOR ?@?`, [u.User, u.Host]);
      grants.push({ user: `${u.User}@${u.Host}`, grants: g.map((row) => Object.values(row)[0]) });
    }
    res.json({ ok: true, tables, indexes, routines, triggers, grants });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/admin/backup', requireAdmin, async (_req, res) => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(BACKUP_DIR, `usims_${stamp}.sql`);
    const dumpArgs = [
      '--single-transaction', '--routines', '--triggers', '--events',
      '--user', process.env.DB_ADMIN_USER,
      '--host', process.env.DB_ADMIN_HOST || process.env.DB_HOST || '127.0.0.1',
      '--port', String(process.env.DB_PORT || 3306),
      '--databases', process.env.DB_NAME || 'usims'
    ];
    const { stdout } = await execFileAsync('mysqldump', dumpArgs, {
      env: { ...process.env, MYSQL_PWD: process.env.DB_ADMIN_PASSWORD }
    });
    await fs.writeFile(file, stdout);
    const stat = await fs.stat(file);
    res.json({ ok: true, file: path.basename(file), bytes: stat.size });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/admin/backups', requireAdmin, async (_req, res) => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const files = await fs.readdir(BACKUP_DIR);
    const items = [];
    for (const name of files.filter((f) => f.endsWith('.sql'))) {
      const stat = await fs.stat(path.join(BACKUP_DIR, name));
      items.push({ name, bytes: stat.size, modified: stat.mtime.toISOString() });
    }
    items.sort((a, b) => b.modified.localeCompare(a.modified));
    res.json({ ok: true, data: items });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/admin/restore', requireAdmin, async (req, res) => {
  try {
    const name = path.basename(String(req.body.file || ''));
    if (!/^usims_[A-Za-z0-9_.-]+\\.sql$/.test(name)) {
      return res.status(400).json({ ok: false, error: 'Invalid backup file' });
    }
    const file = path.resolve(BACKUP_DIR, name);
    if (!file.startsWith(BACKUP_DIR + path.sep)) return res.status(400).json({ ok: false, error: 'Invalid backup file' });
    await fs.access(file);
    await execFileAsync('bash', [
      '-c',
      'mysql --user="$DB_ADMIN_USER" --host="${DB_ADMIN_HOST:-127.0.0.1}" --port="${DB_PORT:-3306}" "$DB_NAME" < "$1"',
      'restore',
      file
    ], {
      env: { ...process.env, MYSQL_PWD: process.env.DB_ADMIN_PASSWORD }
    });
    res.json({ ok: true, restored: name });
  } catch (err) {
    sendError(res, err);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`USIMS API listening on ${PORT}`);
});
