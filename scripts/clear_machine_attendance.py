from zk import ZK

zk = ZK('192.168.40.13', port=4370, timeout=10)
conn = zk.connect()
conn.disable_device()
try:
    logs = conn.get_attendance()
    print(f"Machine attendance logs: {len(logs)}")
    conn.clear_attendance()
    print("Machine attendance cleared successfully.")
finally:
    conn.enable_device()
    conn.disconnect()
