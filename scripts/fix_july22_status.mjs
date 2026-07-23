import mysql from "mysql2/promise";

const conn = await mysql.createConnection(
  "mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway"
);

const [records] = await conn.query(`
  SELECT a.id, e.employeeId, a.checkIn, a.checkOut, a.status, a.lateMinutes,
    COALESCE(s.startTime,'14:00') as shiftStart,
    COALESCE(s.endTime,'23:00') as shiftEnd
  FROM HRMAttendance a
  JOIN HRMEmployee e ON a.employeeId=e.id
  LEFT JOIN HRMShift s ON e.shiftId=s.id
  WHERE a.date='2026-07-22'
`);

let fixed = 0;

for (const rec of records) {
  // No check-in → ABSENT
  if (!rec.checkIn) {
    if (rec.status !== "ABSENT") {
      await conn.query(`UPDATE HRMAttendance SET status='ABSENT', lateMinutes=NULL WHERE id=?`, [rec.id]);
      console.log(`${rec.employeeId}: ${rec.status} → ABSENT (no check-in)`);
      fixed++;
    }
    continue;
  }

  const [sH, sM] = rec.shiftStart.split(":").map(Number);
  const [eH, eM] = rec.shiftEnd.split(":").map(Number);

  const startUtcMins = (sH - 5) * 60 + sM;
  const endUtcMins   = (eH - 5) * 60 + eM;
  // Overnight shift (end <= start in PKT, e.g. 15:00→00:00)
  const effectiveEndUtcMins = endUtcMins <= startUtcMins ? endUtcMins + 1440 : endUtcMins;

  const base = new Date(rec.checkIn);
  base.setUTCHours(0, 0, 0, 0);

  const lateThreshold    = new Date(base.getTime() + (startUtcMins + 30) * 60000);
  const halfDayThreshold = new Date(base.getTime() + (startUtcMins + 4 * 60) * 60000);
  const earlyLeaveThresh = new Date(base.getTime() + (effectiveEndUtcMins - 30) * 60000);

  const checkIn  = new Date(rec.checkIn);
  const checkOut = rec.checkOut ? new Date(rec.checkOut) : null;

  let status;
  if (checkIn >= halfDayThreshold)     status = "HALF_DAY";
  else if (checkIn > lateThreshold)    status = "LATE";
  else                                 status = "PRESENT";

  if (checkOut && checkOut < earlyLeaveThresh && status === "PRESENT") {
    status = "EARLY_LEAVE";
  }

  const lateMinutes = (status === "LATE" || status === "HALF_DAY")
    ? Math.round((checkIn.getTime() - lateThreshold.getTime()) / 60000)
    : null;

  if (status !== rec.status || (lateMinutes ?? 0) !== (rec.lateMinutes ?? 0)) {
    await conn.query(
      `UPDATE HRMAttendance SET status=?, lateMinutes=? WHERE id=?`,
      [status, lateMinutes, rec.id]
    );
    const fmt = d => { const p=new Date(new Date(d).getTime()+5*3600000); return String(p.getUTCHours()).padStart(2,'0')+':'+String(p.getUTCMinutes()).padStart(2,'0'); };
    console.log(`${rec.employeeId}: ${rec.status}(${rec.lateMinutes??0}) → ${status}(${lateMinutes??0}) | in:${fmt(rec.checkIn)} out:${rec.checkOut?fmt(rec.checkOut):'—'} shift:${rec.shiftStart}-${rec.shiftEnd}`);
    fixed++;
  }
}

console.log(`\nDone. Fixed ${fixed} records.`);
await conn.end();
