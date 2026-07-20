import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

const sql = readFileSync("E:/Downloads/u395517514_softcube_crm.sql", "utf8");

const conn = await createConnection({
  host: "tokaido.proxy.rlwy.net",
  port: 38827,
  user: "root",
  password: "AXiZVLUDalWtbqZANGznraJKZaruNlay",
  database: "railway",
  multipleStatements: true,
});

console.log("Connected! Importing...");

// Split by semicolon and run in chunks to avoid memory issues
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"));

let done = 0;
for (const stmt of statements) {
  try {
    await conn.query(stmt + ";");
    done++;
    if (done % 100 === 0) console.log(`${done}/${statements.length} done...`);
  } catch (e) {
    // skip errors for SET statements etc
    if (!stmt.startsWith("SET") && !stmt.startsWith("/*!")) {
      console.error(`Error on: ${stmt.slice(0, 60)}...`, e.message);
    }
  }
}

console.log("Import complete!");
await conn.end();
