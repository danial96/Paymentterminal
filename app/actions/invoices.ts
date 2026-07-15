"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/scope";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStripeAccount(formData: FormData) {
  await requireAdmin();
  await prisma.stripeAccount.create({
    data: {
      name: formData.get("name") as string,
      brandId: formData.get("brandId") ? Number(formData.get("brandId")) : null,
      secretKeyTest: (formData.get("secretKeyTest") as string) || null,
      publishableKeyTest: (formData.get("publishableKeyTest") as string) || null,
      secretKeyLive: (formData.get("secretKeyLive") as string) || null,
      publishableKeyLive: (formData.get("publishableKeyLive") as string) || null,
    },
  });
  revalidatePath("/admin/stripe-accounts");
}

export async function switchStripeMode(id: number, mode: "test" | "live") {
  await requireAdmin();
  await prisma.stripeAccount.update({ where: { id }, data: { mode } });
  revalidatePath("/admin/stripe-accounts");
}

export async function deleteStripeAccount(id: number) {
  await requireAdmin();
  await prisma.stripeAccount.delete({ where: { id } });
  revalidatePath("/admin/stripe-accounts");
}

export async function toggleStripeAccount(id: number, isActive: boolean) {
  await requireAdmin();
  await prisma.stripeAccount.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/stripe-accounts");
}

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${y}${m}-${rand}`;
}

export async function createInvoice(formData: FormData) {
  await requireUser();

  const itemsRaw = formData.get("items") as string;
  const items = JSON.parse(itemsRaw);

  const subtotal = Number(formData.get("subtotal"));
  const discountAmount = Number(formData.get("discountAmount") || 0);
  const taxPercent = Number(formData.get("taxPercent") || 0);
  const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const dueDateRaw = formData.get("dueDate") as string;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      clientId: formData.get("clientId") ? Number(formData.get("clientId")) : null,
      clientName: formData.get("clientName") as string,
      clientCompany: (formData.get("clientCompany") as string) || null,
      clientEmail: (formData.get("clientEmail") as string) || null,
      clientPhone: (formData.get("clientPhone") as string) || null,
      clientAddress: (formData.get("clientAddress") as string) || null,
      stripeAccountId: formData.get("stripeAccountId") ? Number(formData.get("stripeAccountId")) : null,
      brandId: formData.get("brandId") ? Number(formData.get("brandId")) : null,
      items,
      currency: (formData.get("currency") as string) || "gbp",
      subtotal,
      discountAmount: discountAmount || null,
      taxPercent: taxPercent || null,
      taxAmount: taxAmount || null,
      total,
      notes: (formData.get("notes") as string) || null,
      terms: (formData.get("terms") as string) || null,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      paymentMethod: (formData.get("paymentMethod") as string) || "stripe",
      template: (formData.get("template") as string) || "modern",
      showBankName: formData.get("showBankName") !== "false",
      bankName: (formData.get("bankName") as string) || null,
      bankAccountName: (formData.get("bankAccountName") as string) || null,
      bankAccountNumber: (formData.get("bankAccountNumber") as string) || null,
      bankSortCode: (formData.get("bankSortCode") as string) || null,
      bankIban: (formData.get("bankIban") as string) || null,
      bankSwift: (formData.get("bankSwift") as string) || null,
      status: "draft",
    },
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoiceStatus(id: number, status: "draft" | "sent" | "paid" | "cancelled") {
  await requireUser();
  await prisma.invoice.update({
    where: { id },
    data: {
      status,
      ...(status === "paid" ? { paidAt: new Date() } : {}),
      ...(status === "sent" ? { sentAt: new Date() } : {}),
    },
  });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function updateInvoice(id: number, formData: FormData) {
  await requireUser();

  const itemsRaw = formData.get("items") as string;
  const items = JSON.parse(itemsRaw);

  const subtotal = Number(formData.get("subtotal"));
  const discountAmount = Number(formData.get("discountAmount") || 0);
  const taxPercent = Number(formData.get("taxPercent") || 0);
  const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const dueDateRaw = formData.get("dueDate") as string;

  await prisma.invoice.update({
    where: { id },
    data: {
      clientId: formData.get("clientId") ? Number(formData.get("clientId")) : null,
      clientName: formData.get("clientName") as string,
      clientCompany: (formData.get("clientCompany") as string) || null,
      clientEmail: (formData.get("clientEmail") as string) || null,
      clientPhone: (formData.get("clientPhone") as string) || null,
      clientAddress: (formData.get("clientAddress") as string) || null,
      stripeAccountId: formData.get("stripeAccountId") ? Number(formData.get("stripeAccountId")) : null,
      brandId: formData.get("brandId") ? Number(formData.get("brandId")) : null,
      items,
      currency: (formData.get("currency") as string) || "gbp",
      subtotal,
      discountAmount: discountAmount || null,
      taxPercent: taxPercent || null,
      taxAmount: taxAmount || null,
      total,
      notes: (formData.get("notes") as string) || null,
      terms: (formData.get("terms") as string) || null,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      paymentMethod: (formData.get("paymentMethod") as string) || "stripe",
      template: (formData.get("template") as string) || "modern",
      showBankName: formData.get("showBankName") !== "false",
      bankName: (formData.get("bankName") as string) || null,
      bankAccountName: (formData.get("bankAccountName") as string) || null,
      bankAccountNumber: (formData.get("bankAccountNumber") as string) || null,
      bankSortCode: (formData.get("bankSortCode") as string) || null,
      bankIban: (formData.get("bankIban") as string) || null,
      bankSwift: (formData.get("bankSwift") as string) || null,
    },
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function deleteInvoice(id: number) {
  await requireAdmin();
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  redirect("/invoices");
}
