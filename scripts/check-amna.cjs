const mysql = require('mysql2/promise');
mysql.createConnection({host:'127.0.0.1',user:'root',password:'',database:'thesoftcube_crm'}).then(async c => {
  const [r] = await c.query(
    "SELECT DATE_FORMAT(p.paymentDate,'%Y-%m') as month, ROUND(SUM(p.amount),2) as total " +
    "FROM Payment p JOIN ClientService cs ON p.clientServiceId=cs.id " +
    "WHERE p.deletedAt IS NULL AND cs.deletedAt IS NULL " +
    "AND (cs.soldByName='Amna' OR cs.upsellerName='Amna') " +
    "GROUP BY DATE_FORMAT(p.paymentDate,'%Y-%m') ORDER BY month DESC LIMIT 6"
  );
  console.log(JSON.stringify(r, null, 2));
  c.end();
});
