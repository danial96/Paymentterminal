import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/scope";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditInvoiceForm from "./EditInvoiceForm";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoices");
  const { id } = await params;

  const [invoice, clients, stripeAccounts, brands, bankAccounts] = await Promise.all([
    prisma.invoice.findUnique({ where: { id: Number(id) } }),
    prisma.client.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, phone: true } }),
    prisma.stripeAccount.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, brandId: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.bankAccount.findMany({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
  ]);

  if (!invoice) notFound();

  const items = invoice.items as { description: string; quantity: number; unitPrice: number }[];

  const invoiceData = {
    id: invoice.id,
    clientId: invoice.clientId,
    clientName: invoice.clientName,
    clientCompany: (invoice as { clientCompany?: string | null }).clientCompany ?? null,
    clientEmail: invoice.clientEmail ?? null,
    clientPhone: invoice.clientPhone ?? null,
    clientAddress: invoice.clientAddress ?? null,
    stripeAccountId: invoice.stripeAccountId,
    brandId: invoice.brandId,
    items,
    currency: invoice.currency,
    discountAmount: (invoice as { discountAmount?: { toNumber?: () => number } | null }).discountAmount ? Number((invoice as { discountAmount: { toNumber?: () => number } }).discountAmount) : null,
    taxPercent: invoice.taxPercent ? Number(invoice.taxPercent) : null,
    notes: invoice.notes ?? null,
    terms: invoice.terms ?? null,
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split("T")[0] : null,
    paymentMethod: (invoice as { paymentMethod?: string }).paymentMethod ?? "stripe",
    showBankName: (invoice as { showBankName?: boolean }).showBankName !== false,
    bankName: (invoice as { bankName?: string | null }).bankName ?? null,
    bankAccountName: (invoice as { bankAccountName?: string | null }).bankAccountName ?? null,
    bankAccountNumber: (invoice as { bankAccountNumber?: string | null }).bankAccountNumber ?? null,
    bankSortCode: (invoice as { bankSortCode?: string | null }).bankSortCode ?? null,
    bankIban: (invoice as { bankIban?: string | null }).bankIban ?? null,
    bankSwift: (invoice as { bankSwift?: string | null }).bankSwift ?? null,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href={`/invoices/${id}`} className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Edit Invoice</h1>
          <p className="text-xs text-zinc-400 font-mono">{invoice.invoiceNumber}</p>
        </div>
      </div>

      <EditInvoiceForm
        invoice={invoiceData}
        clients={clients}
        stripeAccounts={stripeAccounts}
        brands={brands}
        bankAccounts={bankAccounts}
      />
    </div>
  );
}
