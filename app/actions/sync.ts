"use server";

import { requireAdmin } from "@/lib/scope";
import { runSheetSync } from "@/lib/sync";
import { revalidatePath } from "next/cache";

export async function triggerSync() {
  await requireAdmin();
  await runSheetSync();
  revalidatePath("/admin/sync");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
