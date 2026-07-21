from zk import ZK

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

logs_sorted = sorted(logs, key=lambda x: x.timestamp, reverse=True)
print("Raw fields for last 5 punches:")
for l in logs_sorted[:5]:
    print(vars(l))
