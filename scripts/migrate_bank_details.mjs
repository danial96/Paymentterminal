import mysql from "mysql2/promise";

const conn = await mysql.createConnection(
  "mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway"
);

// Get all employees with old bank data
const [employees] = await conn.query(
  `SELECT id, bankName, bankAccountName, accountNumber, iban
   FROM HRMEmployee
   WHERE (bankName IS NOT NULL AND bankName != '')
      OR (accountNumber IS NOT NULL AND accountNumber != '')
      OR (iban IS NOT NULL AND iban != '')`
);

console.log(`Found ${employees.length} employees with old bank data`);

let migrated = 0;
let skipped = 0;

for (const emp of employees) {
  // Check if they already have a bank account in the new table
  const [existing] = await conn.query(
    `SELECT id FROM HRMEmployeeBankAccount WHERE employeeId = ?`,
    [emp.id]
  );

  if (existing.length > 0) {
    console.log(`Employee ${emp.id}: already has ${existing.length} bank account(s), skipping`);
    skipped++;
    continue;
  }

  // Use bankAccountName as accountTitle, fallback to "Primary Account"
  const accountTitle = emp.bankAccountName?.trim() || "Primary Account";
  const bankName = emp.bankName?.trim() || null;
  const accountNumber = emp.accountNumber?.trim() || null;
  const iban = emp.iban?.trim() || null;

  await conn.query(
    `INSERT INTO HRMEmployeeBankAccount (employeeId, accountTitle, bankName, accountNumber, iban, isDefault, createdAt)
     VALUES (?, ?, ?, ?, ?, true, NOW())`,
    [emp.id, accountTitle, bankName, accountNumber, iban]
  );

  console.log(`Employee ${emp.id}: migrated → ${accountTitle} | ${bankName} | ${accountNumber} | ${iban}`);
  migrated++;
}

console.log(`\nDone. Migrated: ${migrated}, Skipped (already had accounts): ${skipped}`);
await conn.end();
