import mysql from "mysql2/promise";

const conn = await mysql.createConnection(
  "mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway"
);

// Helper: PKT timestamp string → UTC Date
const pktToUtc = (pkt) => new Date(new Date(pkt + "+05:00").getTime());

// Helper: recalculate status given checkIn, checkOut, shiftStart, shiftEnd (all PKT "HH:MM")
function calcStatus(checkIn, checkOut, shiftStart, shiftEnd) {
  const [sH, sM] = shiftStart.split(":").map(Number);
  const [eH, eM] = shiftEnd.split(":").map(Number);
  const base = new Date(checkIn); base.setUTCHours(0, 0, 0, 0);
  const startUtcMins = (sH - 5) * 60 + sM;
  const endUtcMins   = (eH - 5) * 60 + eM;
  const effectiveEndUtcMins = endUtcMins <= startUtcMins ? endUtcMins + 1440 : endUtcMins;
  const lateThreshold    = new Date(base.getTime() + (startUtcMins + 30) * 60000);
  const halfDayThreshold = new Date(base.getTime() + (startUtcMins + 4 * 60) * 60000);
  const earlyLeaveThresh = new Date(base.getTime() + (effectiveEndUtcMins - 30) * 60000);
  let status = checkIn >= halfDayThreshold ? "HALF_DAY" : checkIn > lateThreshold ? "LATE" : "PRESENT";
  if (checkOut && checkOut < earlyLeaveThresh && status === "PRESENT") status = "EARLY_LEAVE";
  const lateMinutes = (status === "LATE" || status === "HALF_DAY")
    ? Math.round((checkIn.getTime() - lateThreshold.getTime()) / 60000) : null;
  return { status, lateMinutes };
}

const fmt = (d) => { if (!d) return "—"; const p = new Date(d.getTime() + 5*3600000); return `${String(p.getUTCHours()).padStart(2,"0")}:${String(p.getUTCMinutes()).padStart(2,"0")}`; };

// Get shifts for affected employees
const [empRows] = await conn.query(`
  SELECT e.employeeId, e.id,
    COALESCE(s.startTime,'14:00') as shiftStart,
    COALESCE(s.endTime,'23:00') as shiftEnd
  FROM HRMEmployee e LEFT JOIN HRMShift s ON e.shiftId=s.id
  WHERE e.employeeId IN ('IKIA1023','IKIA1025','IKIA1030','IKIA1031','IKIA1035','IKIA1036','IKIA1037','IKIA1038','IKIA1039','IKIA1041')
`);
const shiftMap = new Map(empRows.map(e => [e.employeeId, { id: e.id, shiftStart: e.shiftStart, shiftEnd: e.shiftEnd }]));

// Machine-verified updates for July 22
const updates = [
  // Add checkIn + checkOut from machine (was wrongly ABSENT)
  {
    id: "IKIA1030", action: "set_both",
    checkIn:  pktToUtc("2026-07-22T11:58:11"),
    checkOut: pktToUtc("2026-07-22T21:26:37"),
  },
  // Update checkOut only (DB had wrong manual checkout = machine check-in time)
  {
    id: "IKIA1031", action: "set_checkout",
    checkOut: pktToUtc("2026-07-22T22:40:16"),
  },
  {
    id: "IKIA1035", action: "set_checkout",
    checkOut: pktToUtc("2026-07-22T22:39:33"),
  },
  // Add missing checkOut from machine
  {
    id: "IKIA1036", action: "set_checkout",
    checkOut: pktToUtc("2026-07-22T22:40:32"),
  },
  {
    id: "IKIA1039", action: "set_checkout",
    checkOut: pktToUtc("2026-07-22T22:21:37"),
  },
  // Remove wrong checkOut (machine only had check-in punch, no checkout)
  { id: "IKIA1023", action: "clear_checkout" },
  { id: "IKIA1025", action: "clear_checkout" },
  { id: "IKIA1037", action: "clear_checkout" },
  { id: "IKIA1038", action: "clear_checkout" },
  // Zehra: machine only had checkout punch (10:21 PM), no check-in → clear wrong checkIn
  { id: "IKIA1041", action: "clear_checkin" },
];

for (const u of updates) {
  const emp = shiftMap.get(u.id);
  if (!emp) { console.log(`${u.id}: not found`); continue; }

  // Get current DB record
  const [[rec]] = await conn.query(
    `SELECT a.id, a.checkIn, a.checkOut, a.status, a.lateMinutes
     FROM HRMAttendance a JOIN HRMEmployee e ON a.employeeId=e.id
     WHERE e.employeeId=? AND a.date='2026-07-22'`, [u.id]
  );
  if (!rec) { console.log(`${u.id}: no DB record`); continue; }

  const currentCheckIn  = rec.checkIn  ? new Date(rec.checkIn)  : null;
  const currentCheckOut = rec.checkOut ? new Date(rec.checkOut) : null;

  let newCheckIn  = currentCheckIn;
  let newCheckOut = currentCheckOut;

  if (u.action === "set_both")     { newCheckIn = u.checkIn; newCheckOut = u.checkOut; }
  if (u.action === "set_checkout") { newCheckOut = u.checkOut; }
  if (u.action === "clear_checkout") { newCheckOut = null; }
  if (u.action === "clear_checkin")  { newCheckIn = null; newCheckOut = null; }

  // Recalculate hours and status
  let wh = null, ot = null;
  if (newCheckIn && newCheckOut) {
    wh = Math.round((newCheckOut.getTime() - newCheckIn.getTime()) / 36000) / 100;
    ot = Math.max(0, wh - 8);
    ot = ot > 0 ? Math.round(ot * 100) / 100 : null;
  }

  let newStatus = rec.status;
  let newLate   = rec.lateMinutes;
  if (newCheckIn) {
    const calc = calcStatus(newCheckIn, newCheckOut, emp.shiftStart, emp.shiftEnd);
    newStatus = calc.status;
    newLate   = calc.lateMinutes;
  } else {
    newStatus = "ABSENT";
    newLate   = null;
  }

  await conn.query(
    `UPDATE HRMAttendance SET checkIn=?, checkOut=?, workingHours=?, overtimeHours=?, status=?, lateMinutes=? WHERE id=?`,
    [newCheckIn, newCheckOut, wh, ot, newStatus, newLate, rec.id]
  );

  const before = `in:${fmt(currentCheckIn)} out:${fmt(currentCheckOut)} ${rec.status}`;
  const after  = `in:${fmt(newCheckIn)} out:${fmt(newCheckOut)} ${newStatus}(${newLate??0}min) ${wh?wh+"h":"—"}`;
  console.log(`${u.id}  ${before}  →  ${after}`);
}

console.log("\nDone.");
await conn.end();
