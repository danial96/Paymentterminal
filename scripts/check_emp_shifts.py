import pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='', database='thesoftcube_crm')
cur = conn.cursor()
cur.execute("""
    SELECT e.employeeId, e.firstName, e.lastName, s.name, s.startTime
    FROM HRMEmployee e
    LEFT JOIN HRMShift s ON e.shiftId = s.id
    WHERE e.employeeId IN ('IKIA1022','IKIA1020','IKIA1021','IKIA1028','IKIA1025')
    AND e.deletedAt IS NULL
""")
print(f"{'EmpID':<12} {'Name':<28} {'Shift':<15} {'StartTime'}")
print("-" * 65)
for row in cur.fetchall():
    print(f"{str(row[0]):<12} {str(row[1])+' '+str(row[2]):<28} {str(row[3] or 'None'):<15} {str(row[4] or '—')}")
conn.close()
