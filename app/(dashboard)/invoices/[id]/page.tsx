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

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("invoices");
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      stripeAccount: { select: { name: true, id: true } },
    },
  });
  if (!invoice) notFound();

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
        {/* Invoice preview — iframe of public invoice */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-sm border border-zinc-200" style={{ minHeight: "700px" }}>
          <iframe
            src={`/invoice/${invoice.invoiceNumber}?preview=1`}
            className="w-full border-0"
            style={{ height: "900px", display: "block" }}
            title="Invoice Preview"
          />
        </div>

        {/* Actions sidebar */}
        <InvoiceActions
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          status={invoice.status}
          isAdmin={(user as { role?: string }).role === "admin"}
        />
      </div>
    </div>
  );
}
