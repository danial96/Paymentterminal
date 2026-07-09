import "dotenv/config";
import { runSheetSync } from "../lib/sync";

runSheetSync()
  .then((log) => {
    console.log(
      `Sync complete: ${log.rowsProcessed} rows, ${log.clientsCreated} clients created, ${log.clientsUpdated} clients updated, ${log.servicesUpserted} services upserted.`
    );
    const warnings = log.warnings as string[];
    if (warnings.length > 0) {
      console.warn(`Warnings:\n${warnings.map((w) => `  - ${w}`).join("\n")}`);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
