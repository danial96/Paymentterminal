import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

let sql = readFileSync("E:/Downloads/u395517514_softcube_crm.sql", "utf8");

// Convert INSERT INTO → INSERT IGNORE INTO to skip duplicates
sql = sql.replace(/INSERT INTO `/g, "INSERT IGNORE INTO `");

const conn = await createConnection({
  host: "tokaido.proxy.rlwy.net",
  port: 38827,
  user: "root",
  password: "AXiZVLUDalWtbqZANGznraJKZaruNlay",
  database: "railway",
  multipleStatements: false,
});

console.log("Connected!");
await conn.query("SET FOREIGN_KEY_CHECKS=0");

const insertRegex = /^INSERT IGNORE INTO .+?;$/gms;
const inserts = sql.match(insertRegex) || [];
console.log(`Found ${inserts.length} statements`);

let done = 0;
let errors = 0;
for (const stmt of inserts) {
  try {
    await conn.query(stmt);
    done++;
  } catch (e) {
    errors++;
    console.error(`Error: ${stmt.slice(0, 80)}`, e.message);
  }
}

await conn.query("SET FOREIGN_KEY_CHECKS=1");
console.log(`\nDone! ${done} ok, ${errors} errors`);
await conn.end();
