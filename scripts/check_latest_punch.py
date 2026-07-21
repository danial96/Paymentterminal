from zk import ZK
from datetime import datetime

ZK_IP = '192.168.40.13'
ZK_PORT = 4370

zk = ZK(ZK_IP, port=ZK_PORT, timeout=10)
conn = zk.connect()
conn.disable_device()
try:
    logs = conn.get_attendance()
finally:
    conn.enable_device()
    conn.disconnect()

# Sort by timestamp descending, show last 10
logs_sorted = sorted(logs, key=lambda x: x.timestamp, reverse=True)
print(f"Latest 10 punches from machine:\n")
print(f"{'User ID':<12} {'Name':<20} {'Time':<22} {'Type':<10} {'Status'}")
print("-" * 75)
for l in logs_sorted[:10]:
    punch_type = "CHECK-IN" if l.punch == 0 else "CHECK-OUT" if l.punch == 1 else f"type={l.punch}"
    print(f"{l.user_id:<12} {str(getattr(l, 'name', '')):<20} {str(l.timestamp):<22} {punch_type:<10} {l.status}")
