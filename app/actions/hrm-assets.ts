"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export async function createAsset(formData: FormData) {
  await requireUser();
  await prisma.hRMAsset.create({
    data: {
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? ""),
      assetCode: formData.get("assetCode") ? String(formData.get("assetCode")) : null,
      serialNumber: formData.get("serialNumber") ? String(formData.get("serialNumber")) : null,
      brand: formData.get("brand") ? String(formData.get("brand")) : null,
      condition: (String(formData.get("condition") ?? "GOOD")) as "EXCELLENT" | "GOOD" | "FAIR" | "POOR",
      status: (String(formData.get("status") ?? "AVAILABLE")) as "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED",
      employeeId: formData.get("employeeId") ? Number(formData.get("employeeId")) : null,
      issueDate: formData.get("issueDate") ? new Date(String(formData.get("issueDate"))) : null,
      returnDate: formData.get("returnDate") ? new Date(String(formData.get("returnDate"))) : null,
      notes: formData.get("notes") ? String(formData.get("notes")) : null,
    },
  });
  revalidatePath("/hrm/assets");
}

export async function updateAsset(id: number, formData: FormData) {
  await requireUser();
  await prisma.hRMAsset.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? ""),
      assetCode: formData.get("assetCode") ? String(formData.get("assetCode")) : null,
      serialNumber: formData.get("serialNumber") ? String(formData.get("serialNumber")) : null,
      brand: formData.get("brand") ? String(formData.get("brand")) : null,
      condition: (String(formData.get("condition") ?? "GOOD")) as "EXCELLENT" | "GOOD" | "FAIR" | "POOR",
      status: (String(formData.get("status") ?? "AVAILABLE")) as "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED",
      employeeId: formData.get("employeeId") ? Number(formData.get("employeeId")) : null,
      issueDate: formData.get("issueDate") ? new Date(String(formData.get("issueDate"))) : null,
      returnDate: formData.get("returnDate") ? new Date(String(formData.get("returnDate"))) : null,
      notes: formData.get("notes") ? String(formData.get("notes")) : null,
    },
  });
  revalidatePath("/hrm/assets");
}

export async function deleteAsset(id: number) {
  await requireUser();
  await prisma.hRMAsset.delete({ where: { id } });
  revalidatePath("/hrm/assets");
}
