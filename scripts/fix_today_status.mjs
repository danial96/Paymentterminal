import mysql from "mysql2/promise";
const conn = await mysql.createConnection("mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway");

// Fix IKIA1021 status to EARLY_LEAVE (checked out at 5:09 PM on a shift ending midnight)
const [r] = await conn.query(
  `UPDATE HRMAttendance a JOIN HRMEmployee e ON a.employeeId=e.id
   SET a.status='EARLY_LEAVE'
   WHERE e.employeeId='IKIA1021' AND a.date='2026-07-23'`
);
console.log("IKIA1021 status -> EARLY_LEAVE, rows:", r.affectedRows);

await conn.end();
