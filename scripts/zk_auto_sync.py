"""
ZKTeco auto-sync — runs as Windows Scheduled Task on IT's PC every 15 min.
Syncs:
  1. Fingerprint enrollment status
  2. Attendance (check-in / checkout) with correct status calculation

Setup (run once as admin):
  schtasks /create /tn "ZKSync" /tr "python C:\\path\\to\\zk_auto_sync.py" /sc minute /mo 15 /ru SYSTEM
"""
import sys
from zk import ZK
from datetime import datetime, timezone, timedelta
import mysql.connector

ZK_IP      = '192.168.40.13'
ZK_PORT    = 4370
ZK_TIMEOUT = 10

DB_URL = 'mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway'

PKT = timezone(timedelta(hours=5))

def parse_db_url(url):
    url = url.replace('mysql://', '')
    user_pass, rest = url.split('@')
    user, password = user_pass.split(':', 1)
    host_port, db = rest.split('/', 1)
    host, port = host_port.split(':')
    return dict(host=host, port=int(port), user=user, password=password, database=db)

def to_db(ts_utc):
    """Convert UTC-aware datetime to naive PKT for DB storage (DB stores PKT)."""
    return ts_utc.astimezone(PKT).replace(tzinfo=None)


def work_day_date(ts_utc):
    """Return work day date (PKT, day changes at 3 AM PKT)."""
    pkt = ts_utc.astimezone(PKT)
    d = pkt.date()
    if pkt.hour < 3:
        from datetime import date, timedelta as td
        d = d - td(days=1)
    return d

def calc_status(check_in_utc, check_out_utc, shift_start, shift_end):
    """
    check_in_utc / check_out_utc: datetime (UTC, timezone-aware)
    shift_start / shift_end: "HH:MM" strings in PKT
    Returns (status, late_minutes)
    """
    sH, sM = map(int, shift_start.split(':'))
    eH, eM = map(int, shift_end.split(':'))

    # Work day midnight UTC
    work_date = work_day_date(check_in_utc)
    base = datetime(work_date.year, work_date.month, work_date.day, tzinfo=timezone.utc)

    start_utc_mins = (sH - 5) * 60 + sM
    end_utc_mins   = (eH - 5) * 60 + eM
    # Overnight shift (e.g. 15:00-00:00)
    if end_utc_mins <= start_utc_mins:
        end_utc_mins += 1440

    late_thresh     = base + timedelta(minutes=start_utc_mins + 30)
    half_day_thresh = base + timedelta(minutes=start_utc_mins + 4 * 60)
    early_leave_thresh = base + timedelta(minutes=end_utc_mins - 30)

    if check_in_utc >= half_day_thresh:
        status = 'HALF_DAY'
    elif check_in_utc > late_thresh:
        status = 'LATE'
    else:
        status = 'PRESENT'

    if check_out_utc and check_out_utc < early_leave_thresh and status == 'PRESENT':
        status = 'EARLY_LEAVE'

    late_minutes = None
    if status in ('LATE', 'HALF_DAY'):
        late_minutes = int((check_in_utc - late_thresh).total_seconds() / 60)

    return status, late_minutes


def sync():
    now = datetime.now(timezone.utc)
    print(f"[{now.astimezone(PKT).strftime('%Y-%m-%d %H:%M:%S PKT')}] Starting ZK sync...")

    # ── Connect to machine ──────────────────────────────────────────────────
    zk = ZK(ZK_IP, port=ZK_PORT, timeout=ZK_TIMEOUT)
    conn = zk.connect()
    conn.disable_device()
    try:
        users       = conn.get_users()
        templates   = conn.get_templates()
        attendances = conn.get_attendance()
    finally:
        conn.enable_device()
        conn.disconnect()

    # ── Connect to DB ───────────────────────────────────────────────────────
    db     = mysql.connector.connect(**parse_db_url(DB_URL))
    cursor = db.cursor(dictionary=True)

    # ── 1. Fingerprint enrollment sync ─────────────────────────────────────
    tmpl_map = {}
    for t in templates:
        tmpl_map.setdefault(t.uid, []).append(t.fid)

    enrolled_ids, not_enrolled_ids = [], []
    for u in users:
        if u.user_id == '1' or not u.user_id.startswith('IKIA'):
            continue
        (enrolled_ids if tmpl_map.get(u.uid) else not_enrolled_ids).append(u.user_id)

    if enrolled_ids:
        fmt = ','.join(['%s'] * len(enrolled_ids))
        cursor.execute(f'UPDATE HRMEmployee SET fingerprintEnrolled=1 WHERE employeeId IN ({fmt})', enrolled_ids)
    if not_enrolled_ids:
        fmt = ','.join(['%s'] * len(not_enrolled_ids))
        cursor.execute(f'UPDATE HRMEmployee SET fingerprintEnrolled=0 WHERE employeeId IN ({fmt})', not_enrolled_ids)

    print(f"  Fingerprints: {len(enrolled_ids)} enrolled, {len(not_enrolled_ids)} not enrolled")

    # ── 2. Attendance sync ─────────────────────────────────────────────────
    # Build employee map: employeeId → {db_id, shiftStart, shiftEnd}
    cursor.execute("""
        SELECT e.id, e.employeeId,
               COALESCE(s.startTime, '14:00') as shiftStart,
               COALESCE(s.endTime,   '23:00') as shiftEnd
        FROM HRMEmployee e
        LEFT JOIN HRMShift s ON e.shiftId = s.id
        WHERE e.deletedAt IS NULL
    """)
    emp_map = {r['employeeId']: r for r in cursor.fetchall()}

    # Group machine punches by employee+workday
    # punch=0 = check-in direction, punch=1 = check-out direction
    day_map = {}  # (emp_db_id, work_date) → {emp_id, shift_start, shift_end, check_ins:[], check_outs:[]}
    for a in attendances:
        emp = emp_map.get(a.user_id)
        if not emp:
            continue
        # Machine timestamp is naive local PKT time → make UTC-aware
        ts_pkt = a.timestamp.replace(tzinfo=PKT)
        ts_utc = ts_pkt.astimezone(timezone.utc)
        wd = work_day_date(ts_utc)
        key = (emp['id'], wd)
        if key not in day_map:
            day_map[key] = {
                'emp_id': emp['id'],
                'work_date': wd,
                'shift_start': emp['shiftStart'],
                'shift_end':   emp['shiftEnd'],
                'check_ins':   [],
                'check_outs':  [],
            }
        if a.punch == 1:
            day_map[key]['check_outs'].append(ts_utc)
        else:
            day_map[key]['check_ins'].append(ts_utc)

    # Fetch existing attendance records for affected employees
    if not day_map:
        print("  No attendance punches found.")
        db.commit()
        cursor.close()
        db.close()
        return

    emp_ids = list({k[0] for k in day_map})
    fmt = ','.join(['%s'] * len(emp_ids))
    cursor.execute(
        f'SELECT id, employeeId, date, checkIn, checkOut, status FROM HRMAttendance WHERE employeeId IN ({fmt})',
        emp_ids
    )
    existing = {}
    for r in cursor.fetchall():
        # DB date column returned as datetime or date — normalise to date
        d = r['date'].date() if isinstance(r['date'], datetime) else r['date']
        existing[(r['employeeId'], d)] = r

    synced = skipped = 0

    for (emp_db_id, wd), entry in day_map.items():
        rec = existing.get((emp_db_id, wd))

        check_in  = min(entry['check_ins'])  if entry['check_ins']  else None
        check_out = max(entry['check_outs']) if entry['check_outs'] else None
        # Validate checkout is after checkin
        if check_in and check_out and check_out <= check_in:
            check_out = None

        if not check_in and not check_out:
            skipped += 1
            continue

        if not rec:
            # New record — need check_in
            if not check_in:
                skipped += 1
                continue
            effective_out = check_out
            status, late_min = calc_status(check_in, effective_out, entry['shift_start'], entry['shift_end'])
            wh = round((effective_out - check_in).total_seconds() / 3600, 2) if effective_out else None
            ot = round(max(0, wh - 8), 2) if wh and wh > 8 else None
            cursor.execute("""
                INSERT INTO HRMAttendance (employeeId, date, checkIn, checkOut, workingHours, overtimeHours, status, lateMinutes, isManual, createdAt, updatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0, NOW(), NOW())
                ON DUPLICATE KEY UPDATE id=id
            """, (emp_db_id, to_db(datetime(wd.year, wd.month, wd.day, tzinfo=timezone.utc)),
                  to_db(check_in), to_db(effective_out) if effective_out else None,
                  wh, ot, status, late_min))
            synced += 1

        else:
            # Existing record — only update checkout if missing and 60+ min after check-in
            if check_out and not rec['checkOut']:
                existing_ci = rec['checkIn']
                if existing_ci:
                    # DB stores naive PKT — convert to UTC for calc
                    ci_utc = existing_ci.replace(tzinfo=PKT).astimezone(timezone.utc)
                    mins_diff = (check_out - ci_utc).total_seconds() / 60
                    if mins_diff < 60:
                        skipped += 1
                        continue
                    wh = round((check_out - ci_utc).total_seconds() / 3600, 2)
                    ot = round(max(0, wh - 8), 2) if wh > 8 else None

                    # Recalculate status for early leave
                    status, late_min = calc_status(ci_utc, check_out, entry['shift_start'], entry['shift_end'])
                    # Don't downgrade an already-set late/half_day status
                    if rec['status'] in ('LATE', 'HALF_DAY') and status == 'PRESENT':
                        status = rec['status']
                        late_min = None

                    cursor.execute("""
                        UPDATE HRMAttendance
                        SET checkOut=%s, workingHours=%s, overtimeHours=%s, status=%s
                        WHERE id=%s
                    """, (to_db(check_out), wh, ot, status, rec['id']))
                    synced += 1
            else:
                skipped += 1

    # ── 3. Flag missed checkouts ───────────────────────────────────────────
    today_wd = work_day_date(now)
    # DB stores midnight PKT for the date column
    today_wd_db = datetime(today_wd.year, today_wd.month, today_wd.day, 0, 0, 0)
    cursor.execute("""
        UPDATE HRMAttendance
        SET notes = 'Missed checkout — auto flagged at next sync'
        WHERE employeeId IN ({fmt})
          AND date < %s
          AND checkIn IS NOT NULL
          AND checkOut IS NULL
          AND (notes IS NULL OR notes NOT LIKE '%Missed checkout%')
    """.format(fmt=','.join(['%s'] * len(emp_ids))), emp_ids + [today_wd_db])

    # ── 4. Log sync ────────────────────────────────────────────────────────
    cursor.execute(
        'INSERT INTO ZKSyncLog (syncedAt, enrolled, notEnrolled, source, notes) VALUES (NOW(), %s, %s, %s, %s)',
        (len(enrolled_ids), len(not_enrolled_ids), 'python', 'Auto-sync from IT PC')
    )

    db.commit()
    cursor.close()
    db.close()

    print(f"  Attendance: {synced} synced, {skipped} skipped")
    print(f"[{datetime.now(PKT).strftime('%H:%M:%S PKT')}] Done.")


if __name__ == '__main__':
    try:
        sync()
    except Exception as e:
        import traceback
        print(f"ERROR: {e}", file=sys.stderr)
        traceback.print_exc()
        raise SystemExit(1)
