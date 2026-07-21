"""
ZKTeco machine sync script — called from portal sync action via child_process.
Outputs JSON to stdout.
Usage:
  python scripts/zk_sync.py finger_status
  python scripts/zk_sync.py attendance
"""
import sys
import json
from zk import ZK

ZK_IP = '192.168.40.13'
ZK_PORT = 4370
ZK_TIMEOUT = 10


def get_finger_status():
    """Returns per-user finger enrollment status from machine."""
    zk = ZK(ZK_IP, port=ZK_PORT, timeout=ZK_TIMEOUT)
    conn = zk.connect()
    conn.disable_device()
    try:
        users = conn.get_users()
        templates = conn.get_templates()

        tmpl_map = {}
        for t in templates:
            if t.uid not in tmpl_map:
                tmpl_map[t.uid] = []
            tmpl_map[t.uid].append(t.fid)

        result = []
        for u in users:
            if u.user_id == '1':
                continue
            fingers = tmpl_map.get(u.uid, [])
            result.append({
                'userId': u.user_id,
                'uid': u.uid,
                'name': u.name,
                'enrolled': len(fingers) > 0,
                'fingerCount': len(fingers),
                'fingerIds': fingers,
            })
        return result
    finally:
        conn.enable_device()
        conn.disconnect()


def get_attendance():
    """Returns all attendance logs from machine."""
    zk = ZK(ZK_IP, port=ZK_PORT, timeout=ZK_TIMEOUT)
    conn = zk.connect()
    conn.disable_device()
    try:
        attendances = conn.get_attendance()
        result = []
        for a in attendances:
            result.append({
                'userId': a.user_id,
                'timestamp': a.timestamp.isoformat(),
                'status': a.status,
                'punch': a.punch,
            })
        return result
    finally:
        conn.enable_device()
        conn.disconnect()


if __name__ == '__main__':
    command = sys.argv[1] if len(sys.argv) > 1 else 'finger_status'
    try:
        if command == 'finger_status':
            data = get_finger_status()
        elif command == 'attendance':
            data = get_attendance()
        else:
            data = {'error': f'Unknown command: {command}'}
        print(json.dumps(data))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
