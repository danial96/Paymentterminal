/**
 * Fixes corrupt userIds on ZKTeco machine after enrollment.
 * Matches missing IKIA UIDs with corrupt users and updates userId.
 * Fingerprint data is preserved.
 */
import ZKLib from "zkteco-js";
import mysql from "mysql2/promise";

const ADMIN_UID = 343;
const zk = new ZKLib("192.168.40.13", 4370, 10000, 5200);
const db = await mysql.createConnection({
  host: "tokaido.proxy.rlwy.net", port: 38827,
  user: "root", password: "AXiZVLUDalWtbqZANGznraJKZaruNlay",
  database: "railway", ssl: { rejectUnauthorized: false },
});

await zk.createSocket();
console.log("Connected\n");

const res = await zk.getUsers();
const users = res?.data || [];

// Separate IKIA users and corrupt users
const ikiaUsers = new Set(users.filter(u => u.userId?.startsWith("IKIA")).map(u => u.userId));
const corruptUsers = users.filter(u => u.uid !== ADMIN_UID && !u.userId?.startsWith("IKIA") && !u.userId?.match(/^\d+$/));

console.log("Users on machine:", users.length);
console.log("IKIA users:", [...ikiaUsers].join(", ") || "none");
console.log("Corrupt users:", corruptUsers.map(u => `UID ${u.uid} (${u.userId})`).join(", ") || "none");

if (!corruptUsers.length) {
  console.log("\nNo corrupt users found — nothing to fix.");
  await zk.disconnect(); await db.end(); process.exit(0);
}

// Get all employees from DB
const [emps] = await db.query(
  "SELECT id, employeeId, firstName, lastName FROM HRMEmployee WHERE deletedAt IS NULL AND status != 'TERMINATED' ORDER BY id ASC"
);

// Find which IKIA employees are missing from machine
const missingEmps = emps.filter(e => !ikiaUsers.has(e.employeeId));
console.log("\nMissing IKIA employees:", missingEmps.map(e => e.employeeId).join(", ") || "none");

if (!missingEmps.length) {
  console.log("No missing employees — cannot auto-match.");
  await zk.disconnect(); await db.end(); process.exit(0);
}

// Match corrupt UIDs to missing employees (by order)
console.log("\nFixing...");
for (let i = 0; i < Math.min(corruptUsers.length, missingEmps.length); i++) {
  const corrupt = corruptUsers[i];
  const emp = missingEmps[i];
  const name = `${emp.firstName} ${emp.lastName}`.slice(0, 24);

  await zk.setUser(corrupt.uid, emp.employeeId, name, "", 0, 0);
  console.log(`  Fixed UID ${corrupt.uid}: "${corrupt.userId}" → ${emp.employeeId} (${name})`);

  // Mark as enrolled in DB
  await db.query("UPDATE HRMEmployee SET fingerprintEnrolled = 1 WHERE id = ?", [emp.id]);
  console.log(`  DB: ${emp.employeeId} fingerprintEnrolled = true`);
}

// Re-push any remaining missing employees (those without corrupt match)
const fixedCount = Math.min(corruptUsers.length, missingEmps.length);
const stillMissing = missingEmps.slice(fixedCount);
for (const emp of stillMissing) {
  const uid = parseInt(emp.employeeId.replace(/^IKIA|^EMP/i, ""));
  const name = `${emp.firstName} ${emp.lastName}`.slice(0, 24);
  await zk.setUser(uid, emp.employeeId, name, "", 0, 0);
  console.log(`  Re-pushed ${emp.employeeId} UID ${uid}`);
}

await zk.disconnect();
await db.end();
console.log("\nDone! Run sync now to pull attendance.");
