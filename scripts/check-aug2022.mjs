// Run with: node --env-file=.env scripts/check-aug2022.mjs
// Directly fetch August 2022 rows from sheet and check for missing payments

const sheetId = process.env.GOOGLE_SHEET_ID;
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL ?? "";
const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? "";

const privateKeyPem = rawKey.startsWith("LS0t")
  ? Buffer.from(rawKey, "base64").toString("utf-8")
  : rawKey.replace(/\\n/g, "\n");

const pemBody = privateKeyPem
  .replace(/-----BEGIN PRIVATE KEY-----/, "")
  .replace(/-----END PRIVATE KEY-----/, "")
  .replace(/\s+/g, "");
const der = Buffer.from(pemBody, "base64");

const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
const now = Math.floor(Date.now() / 1000);
const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
const payload = Buffer.from(JSON.stringify({ iss: clientEmail, scope: "https://www.googleapis.com/auth/spreadsheets.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })).toString("base64url");
const sigBytes = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, Buffer.from(`${header}.${payload}`));
const sig = Buffer.from(sigBytes).toString("base64url");
const jwt = `${header}.${payload}.${sig}`;

const tokenRes = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
const { access_token } = await tokenRes.json();

const SHEETS_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
function parseDate(v) {
  if (typeof v === "number") return new Date(SHEETS_EPOCH_UTC_MS + v * 86400000);
  if (!v) return null;
  const match = String(v).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
  return null;
}
function parseAmount(v) {
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/Sheet1!A2:M?valueRenderOption=UNFORMATTED_VALUE`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
const data = await res.json();
const values = data.values ?? [];

const AUG_START = new Date(Date.UTC(2022, 7, 1));
const AUG_END = new Date(Date.UTC(2022, 8, 1));

let total = 0;
let count = 0;
const noService = [];

for (let i = 0; i < values.length; i++) {
  const row = values[i];
  const date = parseDate(row[0]);
  if (!date || date < AUG_START || date >= AUG_END) continue;

  const clientName = String(row[1] ?? "").trim();
  if (!clientName) continue;

  const service = String(row[4] ?? "").trim();
  const amountPaid = parseAmount(row[5] ?? 0);

  if (amountPaid > 0) {
    total += amountPaid;
    count++;
    if (!service) {
      noService.push({ rowNum: i + 2, clientName, amountPaid });
    }
  }
}

console.log(`August 2022 rows with amount paid: ${count}`);
console.log(`Total from sheet: £${total.toFixed(2)}`);
console.log(`Rows with NO service but has amount: ${noService.length}`);
noService.forEach(r => console.log(`  Row ${r.rowNum}: ${r.clientName} - £${r.amountPaid}`));
