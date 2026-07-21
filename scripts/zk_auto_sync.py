"""
ZKTeco auto-sync — runs as Windows Scheduled Task on IT's PC.
Reads actual finger templates from machine via pyzk,
updates Railway DB with accurate enrolled status + logs sync time.

Setup (run once as admin):
  schtasks /create /tn "ZKSync" /tr "python C:\path\to\zk_auto_sync.py" /sc minute /mo 15 /ru SYSTEM
"""
import sys
import os
import mysql.connector
from zk import ZK
from datetime import datetime

ZK_IP = '192.168.40.13'
ZK_PORT = 4370
ZK_TIMEOUT = 10

DB_URL = 'mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway'


def parse_db_url(url):
    # mysql://user:pass@host:port/db
    url = url.replace('mysql://', '')
    user_pass, rest = url.split('@')
    user, password = user_pass.split(':', 1)
    host_port, db = rest.split('/', 1)
    host, port = host_port.split(':')
    return dict(host=host, port=int(port), user=user, password=password, database=db)


def sync():
    print(f"[{datetime.now()}] Starting ZK sync...")

    # Connect to ZK machine
    zk = ZK(ZK_IP, port=ZK_PORT, timeout=ZK_TIMEOUT)
    conn = zk.connect()
    conn.disable_device()
    try:
        users = conn.get_users()
        templates = conn.get_templates()
    finally:
        conn.enable_device()
        conn.disconnect()

    # Build finger map
    tmpl_map = {}
    for t in templates:
        if t.uid not in tmpl_map:
            tmpl_map[t.uid] = []
        tmpl_map[t.uid].append(t.fid)

    enrolled_ids = []
    not_enrolled_ids = []
    for u in users:
        if u.user_id == '1' or not u.user_id.startswith('IKIA'):
            continue
        if tmpl_map.get(u.uid):
            enrolled_ids.append(u.user_id)
        else:
            not_enrolled_ids.append(u.user_id)

    print(f"  Machine: {len(enrolled_ids)} enrolled, {len(not_enrolled_ids)} user-only (no finger)")

    # Update Railway DB
    db_cfg = parse_db_url(DB_URL)
    db = mysql.connector.connect(**db_cfg)
    cursor = db.cursor()

    if enrolled_ids:
        fmt = ','.join(['%s'] * len(enrolled_ids))
        cursor.execute(f'UPDATE HRMEmployee SET fingerprintEnrolled=1 WHERE employeeId IN ({fmt})', enrolled_ids)

    if not_enrolled_ids:
        fmt = ','.join(['%s'] * len(not_enrolled_ids))
        cursor.execute(f'UPDATE HRMEmployee SET fingerprintEnrolled=0 WHERE employeeId IN ({fmt})', not_enrolled_ids)

    # Log the sync
    cursor.execute(
        'INSERT INTO ZKSyncLog (syncedAt, enrolled, notEnrolled, source, notes) VALUES (NOW(), %s, %s, %s, %s)',
        (len(enrolled_ids), len(not_enrolled_ids), 'python', f'Auto-sync from IT PC')
    )

    db.commit()
    cursor.close()
    db.close()

    print(f"  DB updated. Enrolled={len(enrolled_ids)}, NotEnrolled={len(not_enrolled_ids)}")
    print(f"[{datetime.now()}] Sync complete.")


if __name__ == '__main__':
    try:
        sync()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
