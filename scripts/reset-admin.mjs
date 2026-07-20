import { createConnection } from "mysql2/promise";

const conn = await createConnection({
  host: "tokaido.proxy.rlwy.net",
  port: 38827,
  user: "root",
  password: "AXiZVLUDalWtbqZANGznraJKZaruNlay",
  database: "railway",
});

const hash = "$2b$10$YO//bRSqYSGT383ozgkAZuMdZmZngNTtq3XcS2qW.2mU5NRIUzmp.";

const [users] = await conn.query("SELECT id, name, email, role FROM User WHERE role = 'admin' LIMIT 5");
console.log("Admin users:", users);

const [result] = await conn.query("UPDATE User SET password = ? WHERE role = 'admin'", [hash]);
console.log(`Updated ${result.affectedRows} admin user(s)`);

await conn.end();
