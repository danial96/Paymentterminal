"use server";

import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addEmployeeBankAccount(formData: FormData) {
  await requireUser();
  const employeeId = Number(formData.get("employeeId"));
  const accountTitle = String(formData.get("accountTitle") ?? "").trim();
  const bankName = String(formData.get("bankName") ?? "").trim() || null;
  const accountNumber = String(formData.get("accountNumber") ?? "").trim() || null;
  const iban = String(formData.get("iban") ?? "").trim() || null;
  const isDefault = formData.get("isDefault") === "true";

  if (!accountTitle) return;

  // If marking as default, unset existing defaults
  if (isDefault) {
    await (prisma as any).hRMEmployeeBankAccount.updateMany({
      where: { employeeId },
      data: { isDefault: false },
    });
  }

  await (prisma as any).hRMEmployeeBankAccount.create({
    data: { employeeId, accountTitle, bankName, accountNumber, iban, isDefault },
  });

  revalidatePath(`/hrm/employees/${employeeId}`);
  revalidatePath(`/hrm/employees/${employeeId}/edit`);
}

export async function deleteEmployeeBankAccount(id: number, employeeId: number) {
  await requireUser();
  await (prisma as any).hRMEmployeeBankAccount.delete({ where: { id } });
  revalidatePath(`/hrm/employees/${employeeId}`);
  revalidatePath(`/hrm/employees/${employeeId}/edit`);
}

export async function setDefaultBankAccount(id: number, employeeId: number) {
  await requireUser();
  await (prisma as any).hRMEmployeeBankAccount.updateMany({
    where: { employeeId },
    data: { isDefault: false },
  });
  await (prisma as any).hRMEmployeeBankAccount.update({
    where: { id },
    data: { isDefault: true },
  });
  revalidatePath(`/hrm/employees/${employeeId}`);
  revalidatePath(`/hrm/employees/${employeeId}/edit`);
}
