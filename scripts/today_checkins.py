from zk import ZK
from datetime import date

zk = ZK('192.168.40.13', port=4370, timeout=10)
conn = zk.connect()
conn.disable_device()
try:
    users = conn.get_users()
    logs = conn.get_attendance()
finally:
    conn.enable_device()
    conn.disconnect()

name_map = {u.user_id: u.name for u in users}
today = date.today()

checkins = [l for l in logs if l.timestamp.date() == today and l.punch == 0]
checkins.sort(key=lambda x: x.timestamp)

print(f"Check-ins today ({today}):\n")
print(f"{'#':<4} {'User ID':<12} {'Name':<28} {'Time'}")
print("-" * 60)
for i, l in enumerate(checkins, 1):
    name = name_map.get(l.user_id, "—")
    print(f"{i:<4} {l.user_id:<12} {name:<28} {l.timestamp.strftime('%I:%M %p')}")
print(f"\nTotal: {len(checkins)}")
