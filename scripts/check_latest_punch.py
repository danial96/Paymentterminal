from zk import ZK
from datetime import datetime

ZK_IP = '192.168.40.13'
ZK_PORT = 4370

zk = ZK(ZK_IP, port=ZK_PORT, timeout=10)
conn = zk.connect()
conn.disable_device()
try:
    users = conn.get_users()
    logs = conn.get_attendance()
finally:
    conn.enable_device()
    conn.disconnect()

name_map = {u.user_id: u.name for u in users}

# Sort by timestamp descending, show last 10
logs_sorted = sorted(logs, key=lambda x: x.timestamp, reverse=True)
print(f"Latest 10 punches from machine:\n")
print(f"{'User ID':<12} {'Name':<26} {'Time':<22} {'Type':<10} {'State'}")
print("-" * 85)
for l in logs_sorted[:10]:
    punch_type = "CHECK-IN" if l.punch == 0 else "CHECK-OUT" if l.punch == 1 else f"punch={l.punch}"
    name = name_map.get(l.user_id, "—")
    print(f"{l.user_id:<12} {name:<26} {str(l.timestamp):<22} {punch_type:<10} {l.status}")
