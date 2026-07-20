/**
 * ZKTeco Local Sync Server
 * Run: node scripts/sync-server.mjs
 * Opens: http://localhost:3001
 *
 * - Auto-syncs every 2 minutes
 * - Manual sync via web UI or GET /sync
 * - Writes directly to Railway MySQL
 */

import http from "http";
import mysql from "mysql2/promise";
import ZKLib from "zkteco-js";

// zkteco-js has a bug where it crashes on null reply after timeout — keep server alive
process.on("uncaughtException", (e) => {
  if (e?.message?.includes("subarray") || e?.message?.includes("TIMEOUT")) {
    console.log("  [zkteco-js internal error — ignored]", e.message);
  } else {
    console.error("Uncaught:", e.message);
  }
});

const ZKTECO_IP   = process.env.ZKTECO_IP   || "192.168.40.13";
const ZKTECO_PORT = parseInt(process.env.ZKTECO_PORT || "4370");
const DB_URL      = process.env.DATABASE_URL || "mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway";
const PORT        = 3001;
const SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

function parseDbUrl(url) {
  const u = new URL(url);
  return { host: u.hostname, port: parseInt(u.port) || 3306, user: u.username, password: u.password, database: u.pathname.slice(1) };
}

let lastResult = { synced: 0, skipped: 0, errors: [], time: null, status: "idle" };
let syncing = false;

async function getDb() {
  return mysql.createConnection({ ...parseDbUrl(DB_URL), ssl: { rejectUnauthorized: false } });
}

async function syncNow() {
  if (syncing) return { error: "Sync already in progress" };
  syncing = true;
  lastResult.status = "syncing";
  lastResult.time = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
  console.log(`[${lastResult.time}] Syncing...`);

  const zk = new ZKLib(ZKTECO_IP, ZKTECO_PORT, 15000, 5200);
  let db;

  try {
    await zk.createSocket();

    let logs = [];
    try {
      const attRes = await zk.getAttendances();
      logs = attRes?.data || [];
    } catch (e) {
      // Machine connected but returned no data (0 records case)
      console.log("  getAttendances error (possibly 0 records):", e.message);
    }
    try { await zk.disconnect(); } catch {};

    if (!logs.length) {
      lastResult = { synced: 0, skipped: 0, errors: [], time: lastResult.time, status: "done" };
      console.log("  No logs on machine.");
      syncing = false;
      return lastResult;
    }

    db = await getDb();

    // Load employee map
    const [emps] = await db.query("SELECT id, employeeId FROM HRMEmployee WHERE deletedAt IS NULL");
    const empMap = new Map();
    for (const e of emps) {
      empMap.set(e.employeeId, e.id);
      const num = e.employeeId.replace(/^IKIA|^EMP/i, "").replace("-", "");
      if (num !== e.employeeId) empMap.set(num, e.id);
    }

    // Group by employee+date
    const dayMap = new Map();
    for (const log of logs) {
      const empId = empMap.get(log.user_id);
      if (!empId) continue;
      const ts = new Date(log.record_time);
      const dateOnly = new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()));
      const key = `${empId}_${dateOnly.getTime()}`;
      const ex = dayMap.get(key);
      if (!ex) dayMap.set(key, { empId, date: dateOnly, first: ts, last: ts });
      else {
        if (ts < ex.first) ex.first = ts;
        if (ts > ex.last) ex.last = ts;
      }
    }

    if (!dayMap.size) {
      lastResult = { synced: 0, skipped: logs.length, errors: [], time: lastResult.time, status: "done" };
      syncing = false;
      await db.end();
      return lastResult;
    }

    // Fetch existing attendance
    const empIds = [...new Set([...dayMap.values()].map(d => d.empId))];
    const [existing] = await db.query(
      `SELECT id, employeeId, date, checkIn, checkOut FROM HRMAttendance WHERE employeeId IN (${empIds.map(() => "?").join(",")}) AND isManual = 0`,
      empIds
    );
    const existMap = new Map();
    for (const r of existing) existMap.set(`${r.employeeId}_${new Date(r.date).getTime()}`, r);

    let synced = 0, skipped = 0;
    const errors = [];
    const enrollIds = new Set();

    for (const [key, entry] of dayMap) {
      const rec = existMap.get(key);
      const lateThreshold = new Date(entry.date);
      lateThreshold.setUTCHours(9, 15, 0, 0);

      try {
        if (!rec) {
          const hasOut = entry.last > entry.first;
          const workMs = hasOut ? entry.last - entry.first : 0;
          const wh = Math.round((workMs / 3600000) * 100) / 100;
          const ot = wh > 8 ? Math.round((wh - 8) * 100) / 100 : 0;
          await db.query(
            `INSERT IGNORE INTO HRMAttendance (employeeId, date, checkIn, checkOut, status, workingHours, overtimeHours, isManual, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
            [entry.empId, entry.date, entry.first, hasOut ? entry.last : null,
             entry.first > lateThreshold ? "LATE" : "PRESENT", wh || null, ot || null]
          );
          enrollIds.add(entry.empId);
          synced++;
        } else if (!rec.checkOut && entry.last > entry.first) {
          const cin = rec.checkIn ? new Date(rec.checkIn) : entry.first;
          const workMs = entry.last - cin;
          const wh = Math.round((workMs / 3600000) * 100) / 100;
          const ot = wh > 8 ? Math.round((wh - 8) * 100) / 100 : 0;
          await db.query(
            "UPDATE HRMAttendance SET checkOut=?, workingHours=?, overtimeHours=?, updatedAt=NOW() WHERE id=?",
            [entry.last, wh, ot, rec.id]
          );
          enrollIds.add(entry.empId);
          synced++;
        } else {
          skipped++;
        }
      } catch (e) {
        errors.push(`emp ${entry.empId}: ${e.message}`);
      }
    }

    // Mark fingerprint enrolled
    if (enrollIds.size) {
      await db.query(
        `UPDATE HRMEmployee SET fingerprintEnrolled=1 WHERE id IN (${[...enrollIds].map(() => "?").join(",")}) AND fingerprintEnrolled=0`,
        [...enrollIds]
      );
    }

    await db.end();
    lastResult = { synced, skipped, errors, time: lastResult.time, status: "done" };
    console.log(`  ✓ Synced ${synced} | Skipped ${skipped} | Errors ${errors.length}`);

  } catch (e) {
    try { await zk.disconnect(); } catch {}
    if (db) try { await db.end(); } catch {}
    lastResult = { synced: 0, skipped: 0, errors: [e.message], time: lastResult.time, status: "error" };
    console.error("  ✗ Error:", e.message);
  }

  syncing = false;
  return lastResult;
}

// Auto sync
setInterval(syncNow, SYNC_INTERVAL_MS);
syncNow(); // sync on startup

// HTTP server
const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ZKTeco Sync Server</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: white; border-radius: 16px; padding: 32px; width: 420px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; color: #18181b; }
  .sub { font-size: 13px; color: #71717a; margin-bottom: 24px; }
  .status { font-size: 13px; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; }
  .status.done { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .status.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .status.syncing { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
  .status.idle { background: #fafafa; color: #71717a; border: 1px solid #e4e4e7; }
  .row { display: flex; gap: 8px; margin-bottom: 8px; }
  .stat { flex: 1; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px; text-align: center; }
  .stat-num { font-size: 24px; font-weight: 700; color: #18181b; }
  .stat-label { font-size: 11px; color: #71717a; margin-top: 2px; }
  button { width: 100%; padding: 12px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; color: white; background: linear-gradient(135deg,#29c0d5,#503d98); margin-top: 16px; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .time { font-size: 11px; color: #a1a1aa; margin-top: 12px; text-align: center; }
  .next { font-size: 11px; color: #a1a1aa; text-align: center; margin-top: 4px; }
</style>
</head>
<body>
<div class="card">
  <h1>🖐 ZKTeco Sync</h1>
  <p class="sub">Auto-syncs every 2 minutes · Office network only</p>
  <div id="status" class="status idle">Checking...</div>
  <div class="row">
    <div class="stat"><div class="stat-num" id="synced">—</div><div class="stat-label">Synced</div></div>
    <div class="stat"><div class="stat-num" id="skipped">—</div><div class="stat-label">Skipped</div></div>
    <div class="stat"><div class="stat-num" id="errors">—</div><div class="stat-label">Errors</div></div>
  </div>
  <button id="btn" onclick="sync()">Sync Now</button>
  <div class="time" id="time"></div>
  <div class="next" id="next"></div>
</div>
<script>
  let nextSync = Date.now() + 120000;
  async function load() {
    const r = await fetch('/status').then(r => r.json());
    const el = document.getElementById('status');
    el.className = 'status ' + r.status;
    el.textContent = r.status === 'syncing' ? '⏳ Syncing in progress...' : r.status === 'error' ? '✗ Error — check logs' : r.status === 'done' ? '✓ Sync complete' : 'Waiting for first sync...';
    document.getElementById('synced').textContent = r.synced ?? '—';
    document.getElementById('skipped').textContent = r.skipped ?? '—';
    document.getElementById('errors').textContent = r.errors?.length ?? '—';
    document.getElementById('time').textContent = r.time ? 'Last sync: ' + r.time : '';
    document.getElementById('btn').disabled = r.status === 'syncing';
  }
  async function sync() {
    document.getElementById('btn').disabled = true;
    document.getElementById('status').className = 'status syncing';
    document.getElementById('status').textContent = '⏳ Syncing...';
    nextSync = Date.now() + 120000;
    await fetch('/sync');
    await load();
    document.getElementById('btn').disabled = false;
  }
  function updateNext() {
    const s = Math.max(0, Math.round((nextSync - Date.now()) / 1000));
    document.getElementById('next').textContent = 'Next auto-sync in ' + s + 's';
  }
  load();
  setInterval(load, 5000);
  setInterval(updateNext, 1000);
  updateNext();
</script>
</body>
</html>`;

http.createServer(async (req, res) => {
  if (req.url === "/sync") {
    await syncNow();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(lastResult));
  } else if (req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(lastResult));
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML);
  }
}).listen(PORT, () => {
  console.log(`\n✓ ZKTeco Sync Server running at http://localhost:${PORT}`);
  console.log(`  ZKTeco: ${ZKTECO_IP}:${ZKTECO_PORT}`);
  console.log(`  Auto-sync every 2 minutes\n`);
});
