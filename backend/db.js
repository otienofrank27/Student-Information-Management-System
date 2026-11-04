import mysql from 'mysql2/promise';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const database = process.env.DB_NAME || 'usims';
const port = Number(process.env.DB_PORT || 3306);

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port,
  user: process.env.DB_USER || 'sims_app',
  password: requiredEnv('DB_PASSWORD'),
  database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  dateStrings: true
});

const adminConnection = {
  user: requiredEnv('DB_ADMIN_USER'),
  password: requiredEnv('DB_ADMIN_PASSWORD'),
  database,
  waitForConnections: true,
  connectionLimit: 4,
  dateStrings: true,
  host: process.env.DB_ADMIN_HOST || process.env.DB_HOST || '127.0.0.1',
  port
};

export const adminPool = mysql.createPool(adminConnection);

export async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function call(procedure, params = []) {
  const placeholders = params.map(() => '?').join(', ');
  const [rows] = await pool.query(`CALL ${procedure}(${placeholders})`, params);
  return Array.isArray(rows) ? rows[0] : rows;
}

export default pool;
