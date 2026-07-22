// Check today's attendance records + employee shifts from production DB
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.production.local', 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^(\w+)="(.+)"$/);
  if (m) process.env[m[1]] = m[2];
}

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use prisma's data proxy / direct URL approach
const { execSync } = require('child_process');

// Run as a separate CJS process
const script = `
const { PrismaClient } = require('./node_modules/@prisma/client');
// Actually need custom output path
`;

// Fallback: use mysql2 directly
const mysql = require('mysql2/promise');

const urlMatch = process.env.DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) { console.error('bad url'); process.exit(1); }
const [, user, pass, host, port, db] = urlMatch;

const conn = await mysql.createConnection({
  host, port: Number(port), user, password: pass, database: db,
  ssl: { rejectUnauthorized: false }
});

// Today's attendance with employee info and shift
const today = new Date().toISOString().slice(0, 10);
const [rows] = await conn.execute(`
  SELECT e.employeeId, e.firstName, e.lastName, s.name AS shiftName, s.startTime AS shiftStart,
         a.checkIn, a.status, a.isManual
  FROM HRMEmployee e
  LEFT JOIN HRMShift s ON e.shiftId = s.id
  LEFT JOIN HRMAttendance a ON a.employeeId = e.id AND DATE(a.date) = ?
  WHERE e.employeeId IN ('IKIA1022','IKIA1020','IKIA1021','IKIA1028','IKIA1025')
    AND e.deletedAt IS NULL
  ORDER BY a.checkIn
`, [today]);

console.log(`\n${'EmpID'.padEnd(12)} ${'Name'.padEnd(28)} ${'Shift'.padEnd(12)} ${'ShiftStart'.padEnd(12)} ${'CheckIn'.padEnd(22)} ${'Status'}`);
console.log('-'.repeat(100));
for (const r of rows) {
  const name = `${r.firstName} ${r.lastName}`;
  const ci = r.checkIn ? new Date(r.checkIn).toISOString() : '—';
  console.log(`${r.employeeId.padEnd(12)} ${name.padEnd(28)} ${(r.shiftName||'None').padEnd(12)} ${(r.shiftStart||'—').padEnd(12)} ${ci.padEnd(22)} ${r.status||'—'}`);
}

await conn.end();
