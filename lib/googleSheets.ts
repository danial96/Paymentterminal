export type SheetRow = {
  rowNumber: number;
  date: string | number;
  clientName: string;
  email: string;
  phone: string;
  service: string;
  amountPaid: string | number;
  remainingAmount: string | number;
  medium: string;
  agentName: string;
  upseller: string;
  brand: string;
  notes: string;
  pm: string;
};

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL ?? "";
  const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? "";

  const privateKeyPem = rawKey.startsWith("LS0t")
    ? Buffer.from(rawKey, "base64").toString("utf-8")
    : rawKey.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKeyPem) {
    throw new Error("Missing GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY env vars");
  }

  // Strip PEM headers and decode to DER
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Buffer.from(pemBody, "base64");

  // Use native Web Crypto API (Node.js 18+) — avoids OpenSSL legacy-provider issues
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss:   clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  })).toString("base64url");

  const sigBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    Buffer.from(`${header}.${payload}`)
  );
  const sig = Buffer.from(sigBytes).toString("base64url");
  const jwt = `${header}.${payload}.${sig}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${text}`);
  }

  const { access_token } = await tokenRes.json() as { access_token: string };
  return access_token;
}

export async function fetchDealRows(): Promise<SheetRow[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const range   = process.env.GOOGLE_SHEET_RANGE ?? "Sheet1!A2:M";
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const accessToken = await getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets API error: ${res.status} ${text}`);
  }

  const data = await res.json() as { values?: unknown[][] };
  const values = data.values ?? [];
  const startRow = 2;

  return values.map((row, i) => ({
    rowNumber:       startRow + i,
    date:            (row[0] ?? "") as string | number,
    clientName:      String(row[1] ?? ""),
    email:           String(row[2] ?? ""),
    phone:           String(row[3] ?? ""),
    service:         String(row[4] ?? ""),
    amountPaid:      (row[5] ?? "") as string | number,
    remainingAmount: (row[6] ?? "") as string | number,
    medium:          String(row[7] ?? ""),
    agentName:       String(row[8] ?? ""),
    upseller:        String(row[9] ?? ""),
    brand:           String(row[10] ?? ""),
    notes:           String(row[11] ?? ""),
    pm:              String(row[12] ?? ""),
  }));
}
