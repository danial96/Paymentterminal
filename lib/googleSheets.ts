import { google } from "googleapis";

export type SheetRow = {
  rowNumber: number;
  // date/amounts come back as raw numbers (Sheets serial date, exact decimal)
  // when the cell is genuinely numeric — only a string if the cell was
  // typed/stored as text. Fetched UNFORMATTED so a cell displaying "£463"
  // (rounded for display) doesn't silently lose its real value of 462.5.
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

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? "";
  // Support base64-encoded key (to avoid hPanel stripping newlines)
  const privateKey = rawKey.startsWith("LS0t")
    ? Buffer.from(rawKey, "base64").toString("utf-8")
    : rawKey.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY env vars"
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function fetchDealRows(): Promise<SheetRow[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const range = process.env.GOOGLE_SHEET_RANGE ?? "Sheet1!A2:M";
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const values = res.data.values ?? [];
  // range starts at row 2 (header is row 1), so first data row is row 2
  const startRow = 2;

  return values.map((row, i) => ({
    rowNumber: startRow + i,
    date: row[0] ?? "",
    clientName: String(row[1] ?? ""),
    email: String(row[2] ?? ""),
    phone: String(row[3] ?? ""),
    service: String(row[4] ?? ""),
    amountPaid: row[5] ?? "",
    remainingAmount: row[6] ?? "",
    medium: String(row[7] ?? ""),
    agentName: String(row[8] ?? ""),
    upseller: String(row[9] ?? ""),
    brand: String(row[10] ?? ""),
    notes: String(row[11] ?? ""),
    pm: String(row[12] ?? ""),
  }));
}
