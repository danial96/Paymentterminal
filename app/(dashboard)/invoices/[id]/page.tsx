import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/scope";
import { notFound } from "next/navigation";
import Link from "next/link";
import InvoiceActions from "./InvoiceActions";

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-zinc-100 text-zinc-600",
  sent:      "bg-blue-100 text-blue-700",
  paid:      "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-500",
};

const CURRENCY_SYMBOLS: Record<string, string> = { gbp: "£", usd: "$", eur: "€", pkr: "₨" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoices");
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      stripeAccount: { select: { name: true, id: true } },
    },
  });
  if (!invoice) notFound();

  const brand = invoice.brandId
    ? await prisma.brand.findUnique({ where: { id: invoice.brandId } })
    : null;

  const items = invoice.items as { description: string; quantity: number; unitPrice: number }[];
  const sym = CURRENCY_SYMBOLS[invoice.currency] ?? "£";
  const clientCompany = (invoice as { clientCompany?: string | null }).clientCompany;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-zinc-900 font-mono">{invoice.invoiceNumber}</h1>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[invoice.status]}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Created {new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              {invoice.paidAt && ` · Paid ${new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}
            </p>
          </div>
        </div>
        {invoice.status !== "paid" && (
          <Link href={`/invoices/${id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit Invoice
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Invoice preview — professional white card */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">

          {/* Header: logo left, INVOICE + meta right */}
          <div className="px-8 py-7 border-b border-zinc-100 flex items-start justify-between gap-6">
            <div>
              {brand?.logoUrl ? (
                <img src={`${brand.logoUrl}?v=1`} alt={brand.name} className="max-h-16 max-w-[180px] object-contain block" />
              ) : (
                <div className="text-2xl font-black text-zinc-900 tracking-tight">{brand?.name ?? invoice.stripeAccount?.name ?? "—"}</div>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-zinc-900 tracking-widest mb-3">INVOICE</h2>
              <table className="border-collapse ml-auto text-xs">
                <tbody>
                  <tr>
                    <td className="border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-500 whitespace-nowrap">#</td>
                    <td className="border border-zinc-200 px-3 py-1.5 font-bold text-zinc-900 text-right min-w-[110px]">{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td className="border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-500">Date</td>
                    <td className="border border-zinc-200 px-3 py-1.5 font-bold text-zinc-900 text-right">
                      {new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                  {invoice.dueDate && (
                    <tr>
                      <td className="border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-500">Due Date</td>
                      <td className="border border-zinc-200 px-3 py-1.5 font-bold text-zinc-900 text-right">
                        {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* From / Bill To */}
          <div className="px-8 py-6 grid grid-cols-2 gap-5 border-b border-zinc-100">
            <div className="border border-zinc-200 rounded-lg p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">From</p>
              <p className="text-sm font-bold text-zinc-900">{brand?.name ?? invoice.stripeAccount?.name ?? "—"}</p>
              {brand?.address && <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">{brand.address}</p>}
              {brand?.phone && <p className="text-xs text-zinc-500">{brand.phone}</p>}
              {brand?.email && <p className="text-xs text-zinc-500">{brand.email}</p>}
              {brand?.website && <p className="text-xs text-zinc-500">{brand.website.replace(/^https?:\/\//, "")}</p>}
            </div>
            <div className="border border-zinc-200 rounded-lg p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Bill To</p>
              {clientCompany && <p className="text-sm font-bold text-zinc-900">{clientCompany}</p>}
              <p className={`text-sm text-zinc-800 ${clientCompany ? "font-normal text-zinc-600" : "font-bold"}`}>{invoice.clientName}</p>
              {invoice.clientEmail && <p className="text-xs text-zinc-500 mt-1">{invoice.clientEmail}</p>}
              {invoice.clientPhone && <p className="text-xs text-zinc-500">{invoice.clientPhone}</p>}
              {invoice.clientAddress && <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">{invoice.clientAddress}</p>}
            </div>
          </div>

          {/* Line items table */}
          <div className="px-8 pt-2 pb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-900">
                  <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-white">Item</th>
                  <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-white w-20">Qty</th>
                  <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-white w-28">Rate</th>
                  <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-white w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-zinc-100 last:border-b-2 last:border-zinc-900">
                    <td className="px-4 py-3 text-sm text-zinc-800">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500 text-right">{sym}{Number(item.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-zinc-900 text-right">{sym}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b border-zinc-100 text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="font-semibold">{sym}{Number(invoice.subtotal).toFixed(2)}</span>
                </div>
                {Number(invoice.discountAmount) > 0 && (
                  <div className="flex justify-between py-2 border-b border-zinc-100 text-sm">
                    <span className="text-zinc-500">Discount</span>
                    <span className="font-semibold text-red-500">-{sym}{Number(invoice.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxPercent && Number(invoice.taxPercent) > 0 && (
                  <div className="flex justify-between py-2 border-b border-zinc-100 text-sm">
                    <span className="text-zinc-500">Tax ({Number(invoice.taxPercent)}%)</span>
                    <span className="font-semibold">{sym}{Number(invoice.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 mt-1 border-t-2 border-zinc-900 text-sm">
                  <span className="font-black text-zinc-900">Total</span>
                  <span className="font-black text-lg text-indigo-600">{sym}{Number(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes / Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="px-8 pb-8 grid grid-cols-2 gap-5 border-t border-zinc-100 pt-5">
              {invoice.notes && (
                <div className="bg-zinc-50 rounded-lg p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Notes</p>
                  <p className="text-xs text-zinc-600 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div className="bg-zinc-50 rounded-lg p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Terms</p>
                  <p className="text-xs text-zinc-600 whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions sidebar */}
        <InvoiceActions
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          status={invoice.status}
          hasStripeAccount={!!invoice.stripeAccount}
          existingPaymentUrl={invoice.stripePaymentLinkUrl ?? null}
        />
      </div>
    </div>
  );
}
