"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scope";

export async function getBankAccounts() {
  return prisma.bankAccount.findMany({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
}

export async function saveBankAccount(
  id: number | null,
  data: { label: string; bankName: string; accountName: string; accountNumber: string; sortCode: string; iban: string; swift: string }
) {
  await requireAdmin();
  if (id) {
    await prisma.bankAccount.update({ where: { id }, data: { label: data.label, bankName: data.bankName || null, accountName: data.accountName || null, accountNumber: data.accountNumber || null, sortCode: data.sortCode || null, iban: data.iban || null, swift: data.swift || null } });
  } else {
    const count = await prisma.bankAccount.count();
    await prisma.bankAccount.create({ data: { label: data.label, bankName: data.bankName || null, accountName: data.accountName || null, accountNumber: data.accountNumber || null, sortCode: data.sortCode || null, iban: data.iban || null, swift: data.swift || null, isDefault: count === 0 } });
  }
}

export async function deleteBankAccount(id: number) {
  await requireAdmin();
  await prisma.bankAccount.delete({ where: { id } });
}

export async function setDefaultBankAccount(id: number) {
  await requireAdmin();
  await prisma.bankAccount.updateMany({ data: { isDefault: false } });
  await prisma.bankAccount.update({ where: { id }, data: { isDefault: true } });
}
