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

  const [services, monthlyTargets, profile] = await Promise.all([
    prisma.clientService.findMany({
      where: { soldByName: sellerName, deletedAt: null },
      select: {
        totalAmount: true,
        saleDate: true,
        payments: { select: { amount: true } },
        client: { select: { name: true, id: true } },
        serviceType: { select: { name: true } },
      },
      orderBy: { saleDate: "asc" },
    }),
    prisma.sellerMonthlyTarget.findMany({
      where: { sellerName },
    }),
    prisma.sellerProfile.findUnique({ where: { name: sellerName } }),
  ]);

  if (services.length === 0) notFound();

  // Map: "YYYY-MM" -> target record
  const targetMap = new Map(monthlyTargets.map((t) => [t.month, t]));

  // Group by month
  const monthMap = new Map<
    string,
    { label: string; deals: number; totalValue: number; amountPaid: number }
  >();

  for (const svc of services) {
    const d = svc.saleDate;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
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
    .map(([key, v]) => {
      const t = targetMap.get(key);
      // Only use per-month target — no global fallback so each month is independent
      const target = t
        ? (profile?.isUpseller
            ? Number(t.upsellTarget ?? t.frontTarget ?? 0)
            : Number(t.frontTarget ?? t.upsellTarget ?? 0))
        : 0;
      const pct = target > 0 ? Math.round((v.totalValue / target) * 100) : null;
      return { ...v, key, target: target > 0 ? target : null, pct };
    });

  const totalValue = services.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalPaid = services.reduce(
    (sum, s) => sum + s.payments.reduce((ps, p) => ps + Number(p.amount), 0),
    0
  );

  // Averages
  const avgDeals = months.length > 0 ? (services.length / months.length).toFixed(1) : "0";
  const avgValue = months.length > 0 ? (totalValue / months.length).toFixed(2) : "0.00";
  const monthsWithTarget = months.filter((m) => m.pct !== null);
  const avgPct =
    monthsWithTarget.length > 0
      ? Math.round(monthsWithTarget.reduce((s, m) => s + m.pct!, 0) / monthsWithTarget.length)
      : null;

  function pctColor(pct: number) {
    if (pct >= 100) return "text-emerald-600 bg-emerald-50";
    if (pct >= 70) return "text-amber-600 bg-amber-50";
    return "text-rose-500 bg-rose-50";
  }

  function barColor(pct: number) {
    if (pct >= 100) return "bg-emerald-500";
    if (pct >= 70) return "bg-amber-400";
    return "bg-rose-400";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/sellers" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Sellers
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900">{sellerName}</h1>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Total Deals</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{services.length}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Total Value</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">£{totalValue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-600">Amount Paid</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">£{totalPaid.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-500">Remaining</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">£{(totalValue - totalPaid).toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Avg / Month</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">£{avgValue}</p>
          <p className="text-xs text-zinc-400">{avgDeals} deals/mo</p>
        </div>
        <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-600">Avg Target Hit</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {avgPct !== null ? `${avgPct}%` : "—"}
          </p>
          <p className="text-xs text-zinc-400">
            {monthsWithTarget.length} month{monthsWithTarget.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Monthly Breakdown</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="border-r border-zinc-200 px-4 py-3">Month</th>
                <th className="border-r border-zinc-200 px-4 py-3">Deals</th>
                <th className="border-r border-zinc-200 px-4 py-3">Total Value</th>
                <th className="border-r border-zinc-200 px-4 py-3">Amount Paid</th>
                <th className="border-r border-zinc-200 px-4 py-3">Remaining</th>
                <th className="border-r border-zinc-200 px-4 py-3">Target</th>
                <th className="border-r border-zinc-200 px-4 py-3">Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {months.map((m) => (
                <tr key={m.label} className="hover:bg-zinc-50 transition-colors">
                  <td className="border-r border-zinc-100 px-4 py-3 font-medium text-zinc-900">{m.label}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-zinc-600">{m.deals}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 font-semibold text-zinc-900">£{m.totalValue.toFixed(2)}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-emerald-700">£{m.amountPaid.toFixed(2)}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-zinc-600">£{(m.totalValue - m.amountPaid).toFixed(2)}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-zinc-500">
                    {m.target ? `£${m.target.toFixed(0)}` : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="border-r border-zinc-100 px-4 py-3">
                    {m.pct !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full rounded-full ${barColor(m.pct)}`}
                            style={{ width: `${Math.min(m.pct, 100)}%` }}
                          />
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pctColor(m.pct)}`}>
                          {m.pct}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">No target set</span>
                    )}
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
