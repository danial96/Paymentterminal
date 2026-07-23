// All timestamps are stored as ACTUAL UTC.
// ZK machine record_time includes "GMT+0500" → new Date() correctly parses to actual UTC.
// Portal and HR check-ins also use new Date() (actual UTC).
// Display with timeZone: "Asia/Karachi" to show correct PKT times.

// Work day changes at 3 AM PKT (= 22:00 UTC previous calendar day).
// ts must be actual UTC.
export function workDayDate(ts: Date): Date {
  // Convert to PKT to determine PKT date and hour
  const pkt = new Date(ts.getTime() + 5 * 3600000);
  const d = new Date(Date.UTC(pkt.getUTCFullYear(), pkt.getUTCMonth(), pkt.getUTCDate()));
  // Before 3 AM PKT = still previous work day
  if (pkt.getUTCHours() < 3) d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

// Today's work day date (PKT-aware, 3 AM boundary)
export function todayWorkDate(): Date {
  return workDayDate(new Date());
}
