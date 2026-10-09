"use server";

import { requireAdmin } from "@/lib/scope";
import { runSheetSync } from "@/lib/sync";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function triggerSync() {
  await requireAdmin();
  await runSheetSync();
  revalidatePath("/admin/sync");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function resetSheetData() {
  await requireAdmin();

  // Delete only sheet-synced records (those with externalRef set).
  // Invoices, brands, users, seller profiles and targets are untouched.
  await prisma.payment.deleteMany({ where: { externalRef: { not: null } } });
  await prisma.clientService.deleteMany({ where: { externalRef: { not: null } } });

  // Remove clients that have no services left (they came from the sheet).
  // Clients with manually-created services are kept.
  await prisma.client.deleteMany({ where: { services: { none: {} } } });

  // Clear sync logs so the next sync log is fresh.
  await prisma.syncLog.deleteMany({});

  // Now pull fresh data from the sheet.
  await runSheetSync();

  revalidatePath("/admin/sync");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/sellers");
}
