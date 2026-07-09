import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/scope";
import Link from "next/link";
import DeleteInvoiceButton from "./DeleteInvoiceButton";

const STATUS_STYLES = {
  draft:     "bg-zinc-100 text-zinc-600",
  sent:      "bg-blue-100 text-blue-700",
  paid:      "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-500",
};

export default async function InvoicesPage() {
  const user = await requirePermission("invoices");
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { stripeAccount: { select: { name: true } } },
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    pending: invoices.filter((i) => i.status === "sent").length,
    totalValue: invoices.reduce((s, i) => s + Number(i.total), 0),
    paidValue: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0),
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Invoices</h1>
        <Link href="/invoices/new" className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Invoices", value: stats.total, sub: null, color: "border-zinc-200" },
          { label: "Paid", value: stats.paid, sub: `£${stats.paidValue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, color: "border-green-200" },
          { label: "Pending", value: stats.pending, sub: null, color: "border-blue-200" },
          { label: "Total Value", value: `£${stats.totalValue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, sub: null, color: "border-indigo-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.color} bg-white px-4 py-3`}>
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className="text-xl font-bold text-zinc-900 mt-0.5">{s.value}</p>
            {s.sub && <p className="text-xs text-green-600 mt-0.5">{s.sub} collected</p>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto h-10 w-10 text-zinc-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm text-zinc-400">No invoices yet</p>
            <Link href="/invoices/new" className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline font-medium">
              Create your first invoice →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <th className="px-4 py-2.5 border-r border-zinc-200">Invoice #</th>
                <th className="px-4 py-2.5 border-r border-zinc-200">Client</th>
                <th className="px-4 py-2.5 border-r border-zinc-200">Stripe Account</th>
                <th className="px-4 py-2.5 border-r border-zinc-200">Amount</th>
                <th className="px-4 py-2.5 border-r border-zinc-200">Due Date</th>
                <th className="px-4 py-2.5 border-r border-zinc-200">Status</th>
                <th className="px-4 py-2.5 border-r border-zinc-200">Date</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-2.5 border-r border-zinc-100">
                    <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-semibold text-indigo-600 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 border-r border-zinc-100 font-medium text-zinc-800">
                    <Link href={`/invoices/${inv.id}`} className="hover:underline">{inv.clientName}</Link>
                    {inv.clientEmail && <p className="text-xs text-zinc-400">{inv.clientEmail}</p>}
                  </td>
                  <td className="px-4 py-2.5 border-r border-zinc-100 text-xs text-zinc-500">{inv.stripeAccount?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 border-r border-zinc-100 font-semibold text-zinc-900">
                    £{Number(inv.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 border-r border-zinc-100 text-xs text-zinc-500">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-2.5 border-r border-zinc-100">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 border-r border-zinc-100 text-xs text-zinc-400">
                    {new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {inv.status !== "paid" && (
                        <Link href={`/invoices/${inv.id}/edit`} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit
                        </Link>
                      )}
                      {(inv.status !== "paid" || user.role === "admin") && (
                        <DeleteInvoiceButton id={inv.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
