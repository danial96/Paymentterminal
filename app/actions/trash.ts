"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scope";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const NOW = () => new Date();

// ── Soft delete ──────────────────────────────────────────────

export async function trashClient(id: number) {
  await requireAdmin();
  await prisma.client.update({ where: { id }, data: { deletedAt: NOW() } });
  revalidatePath("/clients");
  revalidatePath("/admin/trash");
  redirect("/clients");
}

export async function trashService(id: number, clientId: number) {
  await requireAdmin();
  await prisma.clientService.update({ where: { id }, data: { deletedAt: NOW() } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/renewals");
  revalidatePath("/dashboard");
  revalidatePath("/admin/trash");
}

export async function trashPayment(id: number, clientId: number) {
  await requireAdmin();
  await prisma.payment.update({ where: { id }, data: { deletedAt: NOW() } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/admin/trash");
}

// ── Restore ──────────────────────────────────────────────────

export async function restoreClient(id: number) {
  await requireAdmin();
  await prisma.client.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/clients");
  revalidatePath("/admin/trash");
}

export async function restoreService(id: number) {
  await requireAdmin();
  await prisma.clientService.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/admin/trash");
}

export async function restorePayment(id: number) {
  await requireAdmin();
  await prisma.payment.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/admin/trash");
}

// ── Permanent delete ─────────────────────────────────────────

export async function permanentDeleteClient(id: number) {
  await requireAdmin();
  await prisma.client.delete({ where: { id } });
  revalidatePath("/admin/trash");
}

export async function permanentDeleteService(id: number) {
  await requireAdmin();
  await prisma.clientService.delete({ where: { id } });
  revalidatePath("/admin/trash");
}

export async function permanentDeletePayment(id: number) {
  await requireAdmin();
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/admin/trash");
}
