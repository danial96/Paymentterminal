import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/scope";
import InvoiceForm from "../InvoiceForm";
import Link from "next/link";

export default async function NewInvoicePage() {
  await requirePermission("invoices");
  const [clients, stripeAccounts, brands] = await Promise.all([
    prisma.client.findMany({ where: { deletedAt: null }, select: { id: true, name: true, email: true, phone: true }, orderBy: { name: "asc" } }),
    prisma.stripeAccount.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">New Invoice</h1>
          <p className="text-xs text-zinc-500">Fill in the details and generate a Stripe payment link</p>
        </div>
      </div>
      <InvoiceForm clients={clients} stripeAccounts={stripeAccounts} brands={brands} />
    </div>
  );
}
