import mysql from "mysql2/promise";

const conn = await mysql.createConnection(
  "mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway"
);

// Fetch all July 23 biometric attendance records with employee shifts
const [records] = await conn.query(`
  SELECT
    a.id, a.checkIn, a.checkOut, a.lateMinutes, a.status,
    e.employeeId,
    COALESCE(s.startTime, '14:00') as shiftStart,
    COALESCE(s.endTime,   '23:00') as shiftEnd
  FROM HRMAttendance a
  JOIN HRMEmployee e ON a.employeeId = e.id
  LEFT JOIN HRMShift s ON e.shiftId = s.id
  WHERE a.date = '2026-07-23' AND a.isManual = 0 AND a.checkIn IS NOT NULL
`);

let fixed = 0;

for (const rec of records) {
  const [shiftH, shiftM] = rec.shiftStart.split(":").map(Number);
  const [endH, endM]     = rec.shiftEnd.split(":").map(Number);

  // All timestamps are actual UTC. Shift times in PKT → subtract 5h for UTC.
  // lateThreshold  = shift start + 30 min grace (in UTC)
  // halfDayThreshold = shift start + 4 hours (in UTC)
  // earlyLeaveThreshold = shift end - 30 min grace (in UTC)
  const base = new Date(rec.checkIn);
  base.setUTCHours(0, 0, 0, 0); // midnight UTC of that day

  const lateSecs        = (shiftH - 5) * 3600 + (shiftM + 30) * 60;
  const halfDaySecs     = (shiftH - 5) * 3600 + shiftM * 60 + 4 * 3600;
  const earlyLeaveSecs  = (endH   - 5) * 3600 +  endM  * 60 - 30 * 60;

  const lateThreshold     = new Date(base.getTime() + lateSecs     * 1000);
  const halfDayThreshold  = new Date(base.getTime() + halfDaySecs  * 1000);
  const earlyLeaveThresh  = new Date(base.getTime() + earlyLeaveSecs * 1000);

  const checkIn  = new Date(rec.checkIn);
  const checkOut = rec.checkOut ? new Date(rec.checkOut) : null;

  let status;
  if (checkIn >= halfDayThreshold) {
    status = "HALF_DAY";
  } else if (checkIn > lateThreshold) {
    status = "LATE";
  } else {
    status = "PRESENT";
  }

  if (checkOut && checkOut < earlyLeaveThresh && status === "PRESENT") {
    status = "EARLY_LEAVE";
  }

  const lateMinutes = (status === "LATE" || status === "HALF_DAY")
    ? Math.round((checkIn.getTime() - lateThreshold.getTime()) / 60000)
    : 0;

  // Only update if something changed
  if (status !== rec.status || lateMinutes !== (rec.lateMinutes ?? 0)) {
    await conn.query(
      `UPDATE HRMAttendance SET status = ?, lateMinutes = ? WHERE id = ?`,
      [status, lateMinutes || null, rec.id]
    );
    console.log(`${rec.employeeId} | shift ${rec.shiftStart} | checkIn ${checkIn.toISOString()} | was ${rec.status}(${rec.lateMinutes}min) → now ${status}(${lateMinutes}min)`);
    fixed++;
  }
}

console.log(`\nDone. Fixed ${fixed} records.`);
await conn.end();
