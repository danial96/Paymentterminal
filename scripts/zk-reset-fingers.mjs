import ZKLib from "zkteco-js";
import mysql from "mysql2/promise";

const ADMIN_UID = 343;
const zk = new ZKLib("192.168.40.13", 4370, 10000, 5200);

const db = await mysql.createConnection({
  host: "tokaido.proxy.rlwy.net", port: 38827,
  user: "root", password: "AXiZVLUDalWtbqZANGznraJKZaruNlay",
  database: "railway", ssl: { rejectUnauthorized: false },
});

console.log("Connecting to ZKTeco...");
await zk.createSocket();
console.log("Connected\n");

// Delete all users except admin
const res = await zk.getUsers();
const users = res?.data || [];
for (const u of users) {
  if (u.uid === ADMIN_UID) { console.log(`SKIP  UID ${u.uid} (admin)`); continue; }
  await zk.deleteUser(u.uid);
  console.log(`DEL   UID ${u.uid}  ${u.userId}  ${u.name}`);
}

// Clear all attendance logs
await zk.clearAttendanceLog();
console.log("\nAttendance logs cleared");

// Re-push employees (no fingerprint data — clean slate)
const [emps] = await db.query(
  "SELECT id, employeeId, firstName, lastName FROM HRMEmployee WHERE deletedAt IS NULL AND status != 'TERMINATED' ORDER BY id ASC"
);
console.log(`\nPushing ${emps.length} employees to machine...`);
for (const emp of emps) {
  const uid = parseInt(emp.employeeId.replace(/^IKIA|^EMP/i, ""));
  const name = `${emp.firstName} ${emp.lastName}`.slice(0, 24);
  await zk.setUser(uid, emp.employeeId, name, "", 0, 0);
  console.log(`  OK  UID ${uid}  ${emp.employeeId}  ${name}`);
}

// Reset DB
await db.query("UPDATE HRMEmployee SET fingerprintEnrolled = 0 WHERE deletedAt IS NULL");
console.log("\nReset fingerprintEnrolled = false in DB");

await zk.disconnect();
await db.end();
console.log("\nDone! All fingerprints removed. Re-enroll from portal.");
