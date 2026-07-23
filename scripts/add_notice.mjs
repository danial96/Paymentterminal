import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'tokaido.proxy.rlwy.net',
  port: 38827,
  user: 'root',
  password: 'AXiZVLUDalWtbqZANGznraJKZaruNlay',
  database: 'railway',
  ssl: { rejectUnauthorized: false },
});

const content = `We're excited to introduce your Employee Self-Service Portal — a dedicated space where you can manage your work life at your fingertips.

What you can do:
• View your real-time attendance — check-in/out times & working hours
• Apply for leaves and track approval status
• Request your payslip from HR
• Request your Bank Account Opening Letter from HR
• Read company notices & announcements
• Submit complaints or concerns privately
• View and request updates to your profile information
• Change your portal password

Login with your company email and your Employee ID as the default password.`;

const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

const [result] = await conn.execute(
  `INSERT INTO HRMNotice (title, content, type, priority, targetAll, isPublished, publishedAt, createdAt, updatedAt)
   VALUES (?, ?, 'GENERAL', 'HIGH', 1, 1, ?, ?, ?)`,
  ['Employee Self-Service Portal is Now Live', content, now, now, now]
);

console.log('Notice inserted — ID:', result.insertId);
await conn.end();
