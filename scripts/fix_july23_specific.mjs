import mysql from "mysql2/promise";

const conn = await mysql.createConnection(
  "mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway"
);

// 1. Taha Jawaid (IKIA1025) — remove wrong checkout, keep LATE status
const [taha] = await conn.query(`
  UPDATE HRMAttendance a
  JOIN HRMEmployee e ON a.employeeId = e.id
  SET a.checkOut = NULL, a.workingHours = NULL, a.overtimeHours = NULL
  WHERE e.employeeId = 'IKIA1025' AND a.date = '2026-07-23'
`);
console.log(`Taha Jawaid: removed checkout (${taha.affectedRows} row)`);

// 2. Zain (IKIA1023) — checkIn was yesterday's punch, delete entire July 23 record
const [zain] = await conn.query(`
  DELETE a FROM HRMAttendance a
  JOIN HRMEmployee e ON a.employeeId = e.id
  WHERE e.employeeId = 'IKIA1023' AND a.date = '2026-07-23'
`);
console.log(`Zain Ul Abideen: deleted wrong July 23 record (${zain.affectedRows} row)`);

// 3. User IKIA1021 — remove test checkout, keep PRESENT status
const [user] = await conn.query(`
  UPDATE HRMAttendance a
  JOIN HRMEmployee e ON a.employeeId = e.id
  SET a.checkOut = NULL, a.workingHours = NULL, a.overtimeHours = NULL
  WHERE e.employeeId = 'IKIA1021' AND a.date = '2026-07-23'
`);
console.log(`IKIA1021 (you): removed test checkout (${user.affectedRows} row)`);

await conn.end();
