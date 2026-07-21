import mysql.connector

DB_URL = 'mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway'

def parse_db_url(url):
    url = url.replace('mysql://', '')
    user_pass, rest = url.split('@')
    user, password = user_pass.split(':', 1)
    host_port, db = rest.split('/', 1)
    host, port = host_port.split(':')
    return dict(host=host, port=int(port), user=user, password=password, database=db)

db = mysql.connector.connect(**parse_db_url(DB_URL))
cursor = db.cursor()
cursor.execute('SELECT COUNT(*) FROM HRMAttendance')
count = cursor.fetchone()[0]
print(f"Records found: {count}")
cursor.execute('DELETE FROM HRMAttendance')
db.commit()
print(f"Deleted {cursor.rowcount} records. DB is now clean.")
cursor.close()
db.close()
