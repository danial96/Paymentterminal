import ZKLib from "zkteco-js";
import mysql from "mysql2/promise";

const IP = process.env.ZKTECO_IP || "192.168.40.13";
const PORT = parseInt(process.env.ZKTECO_PORT || "4370");
const ADMIN_UID = 343; // Wasiq — never delete

const DB_URL = process.env.DATABASE_URL || "mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway";

function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname, port: parseInt(u.port) || 3306,
    user: u.username, password: u.password,
    database: u.pathname.slice(1),
  };
}

const zk = new ZKLib(IP, PORT, 10000, 5200);

async function main() {
  // ── Connect DB ────────────────────────────────────────────────
  const db = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log("✓ DB connected");

  // ── Connect ZKTeco ────────────────────────────────────────────
  console.log(`\nConnecting to ZKTeco at ${IP}:${PORT}...`);
  await zk.createSocket();
  console.log("✓ ZKTeco connected\n");

  // ── Step 1: Delete all users except admin ─────────────────────
  const usersRes = await zk.getUsers();
  const users = usersRes?.data || [];
  console.log(`Found ${users.length} users on machine`);

  let deleted = 0;
  for (const u of users) {
    if (u.uid === ADMIN_UID) {
      console.log(`  SKIP  UID ${u.uid} (${u.name}) — admin`);
      continue;
    }
    try {
      await zk.deleteUser(u.uid);
      console.log(`  DEL   UID ${u.uid}  userId=${u.userId}  name=${u.name}`);
      deleted++;
    } catch (e) {
      console.log(`  FAIL  UID ${u.uid}: ${e.message}`);
    }
  }
  console.log(`\n✓ Deleted ${deleted} users\n`);

  // ── Step 2: Clear attendance logs ─────────────────────────────
  console.log("Clearing attendance logs...");
  await zk.clearAttendanceLog();
  console.log("✓ Attendance logs cleared\n");

  // ── Step 3: Push employees from DB ───────────────────────────
  const [rows] = await db.query(
    "SELECT id, employeeId, firstName, lastName FROM HRMEmployee WHERE deletedAt IS NULL AND status != 'TERMINATED' ORDER BY id ASC"
  );
  console.log(`Found ${rows.length} employees in DB — pushing to ZKTeco...\n`);

  let pushed = 0;
  let failed = 0;
  for (const emp of rows) {
    const numStr = emp.employeeId.replace(/^IKIA|^EMP/i, "").replace("-", "");
    const uid = parseInt(numStr);
    if (isNaN(uid)) {
      console.log(`  SKIP  ${emp.employeeId} — cannot parse UID`);
      continue;
    }
    const name = `${emp.firstName} ${emp.lastName}`.slice(0, 24);
    try {
      await zk.setUser(uid, emp.employeeId, name, "", 0, 0);
      console.log(`  OK    UID ${uid}  userId=${emp.employeeId}  name=${name}`);
      pushed++;
    } catch (e) {
      console.log(`  FAIL  ${emp.employeeId}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✓ Pushed ${pushed} employees | Failed ${failed}\n`);

  await zk.disconnect();
  await db.end();
  console.log("✓ Done!\n");
}

main().catch(async (e) => {
  console.error("\nError:", e.message);
  try { await zk.disconnect(); } catch {}
  process.exit(1);
});
