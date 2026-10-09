"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scope";
import { revalidatePath } from "next/cache";

export async function upsertSellerProfile(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  function parseTarget(key: string) {
    const v = formData.get(key);
    return v && String(v).trim() !== "" ? parseFloat(String(v)) : null;
  }

  const monthlyTarget = parseTarget("monthlyTarget");
  const frontTarget = parseTarget("frontTarget");
  const upsellTarget = parseTarget("upsellTarget");

  const data: Record<string, unknown> = {};
  if (monthlyTarget !== null) data.monthlyTarget = monthlyTarget;
  if (frontTarget !== null) data.frontTarget = frontTarget;
  if (upsellTarget !== null) data.upsellTarget = upsellTarget;

  await prisma.sellerProfile.upsert({
    where: { name },
    create: { name, isActive: true, ...data },
    update: data,
  });
  revalidatePath("/sellers");
  revalidatePath("/sellers/manage");
}

export async function toggleSellerActive(name: string, isActive: boolean) {
  await requireAdmin();
  await prisma.sellerProfile.upsert({
    where: { name },
    create: { name, isActive },
    update: { isActive },
  });
  revalidatePath("/sellers");
  revalidatePath("/sellers/manage");
}

export async function deleteSellerProfile(name: string) {
  await requireAdmin();
  await prisma.sellerProfile.deleteMany({ where: { name } });
  revalidatePath("/sellers");
  revalidatePath("/sellers/manage");
}

export async function upsertMonthlyTarget(
  sellerName: string,
  month: string, // "YYYY-MM"
  frontTarget: number | null,
  upsellTarget: number | null
) {
  await requireAdmin();
  await prisma.sellerMonthlyTarget.upsert({
    where: { sellerName_month: { sellerName, month } },
    create: { sellerName, month, frontTarget, upsellTarget },
    update: { frontTarget, upsellTarget },
  });
  revalidatePath("/sellers");
  revalidatePath(`/sellers/${encodeURIComponent(sellerName)}`);
  revalidatePath("/sellers/manage");
}

export async function toggleSellerRole(
  name: string,
  field: "isFrontSeller" | "isUpseller",
  value: boolean
) {
  await requireAdmin();
  await prisma.sellerProfile.upsert({
    where: { name },
    create: { name, isActive: true, [field]: value },
    update: { [field]: value },
  });
  revalidatePath("/sellers");
  revalidatePath("/sellers/manage");
}
