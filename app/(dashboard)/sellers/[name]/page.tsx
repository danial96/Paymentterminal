import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const sellerName = decodeURIComponent(name);

  const services = await prisma.clientService.findMany({
    where: { soldByName: sellerName, deletedAt: null },
    select: {
      totalAmount: true,
      saleDate: true,
      description: true,
      payments: { select: { amount: true } },
      client: { select: { name: true, id: true } },
      serviceType: { select: { name: true } },
    },
    orderBy: { saleDate: "asc" },
  });

  if (services.length === 0) notFound();

  // Group by month
  const monthMap = new Map<
    string,
    { label: string; deals: number; totalValue: number; amountPaid: number }
  >();

  for (const svc of services) {
    const d = svc.saleDate;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const paid = svc.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const existing = monthMap.get(key) ?? { label, deals: 0, totalValue: 0, amountPaid: 0 };
    monthMap.set(key, {
      label,
      deals: existing.deals + 1,
      totalValue: existing.totalValue + Number(svc.totalAmount),
      amountPaid: existing.amountPaid + paid,
    });
  }

  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);

  const totalValue = services.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalPaid = services.reduce(
    (sum, s) => sum + s.payments.reduce((ps, p) => ps + Number(p.amount), 0),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/sellers" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Sellers
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900">{sellerName}</h1>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Deals", value: String(services.length) },
          { label: "Total Value", value: `£${totalValue.toFixed(2)}` },
          { label: "Amount Paid", value: `£${totalPaid.toFixed(2)}` },
          { label: "Remaining", value: `£${(totalValue - totalPaid).toFixed(2)}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Monthly Breakdown</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
                <th className="border-r border-zinc-200 px-4 py-3">Month</th>
                <th className="border-r border-zinc-200 px-4 py-3">Deals</th>
                <th className="border-r border-zinc-200 px-4 py-3">Total Value</th>
                <th className="border-r border-zinc-200 px-4 py-3">Amount Paid</th>
                <th className="border-r border-zinc-200 px-4 py-3">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {months.map((m) => (
                <tr key={m.label} className="hover:bg-zinc-50">
                  <td className="border-r border-zinc-100 px-4 py-3 font-medium text-zinc-900">{m.label}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-zinc-600">{m.deals}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-zinc-900">£{m.totalValue.toFixed(2)}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-green-700">£{m.amountPaid.toFixed(2)}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-amber-600">
                    £{(m.totalValue - m.amountPaid).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
