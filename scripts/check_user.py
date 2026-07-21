from zk import ZK

zk = ZK('192.168.40.13', port=4370, timeout=10)
conn = zk.connect()
conn.disable_device()
try:
    users = conn.get_users()
    templates = conn.get_templates()
finally:
    conn.enable_device()
    conn.disconnect()

tmpl_map = {}
for t in templates:
    if t.uid not in tmpl_map:
        tmpl_map[t.uid] = []
    tmpl_map[t.uid].append(t.fid)

target = 'IKIA1036'
found = [u for u in users if u.user_id == target]
if found:
    u = found[0]
    fingers = tmpl_map.get(u.uid, [])
    print(f"FOUND: uid={u.uid}, name='{u.name}', fingers={fingers if fingers else 'NO FINGERPRINT'}")
else:
    print(f"NOT FOUND on machine: {target}")
