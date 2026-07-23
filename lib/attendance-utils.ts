// All attendance timestamps use "PKT-as-UTC" convention:
// ZK machine sends bare local PKT time strings → new Date() treats them as UTC →
// stored value has PKT clock value in the UTC slot.
// Portal also uses pktNow() to match this convention.
// Display without timezone shows the correct PKT value.

export function pktNow(): Date {
  return new Date(Date.now() + 5 * 3600000);
}

// Work day changes at 3 AM PKT (stored as 03:00 in the UTC slot).
// Checkouts before 3 AM PKT belong to the previous calendar day's work record.
// ts must be a PKT-as-UTC timestamp.
export function workDayDate(ts: Date): Date {
  const d = new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()));
  if (ts.getUTCHours() < 3) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return d;
}

// Today's work day date based on current PKT time
export function todayWorkDate(): Date {
  return workDayDate(pktNow());
}
