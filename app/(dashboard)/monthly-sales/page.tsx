import { requireUser, clientScopeWhere } from "@/lib/scope";
import { getMonthlyBreakdown } from "@/lib/monthlyBreakdown";
import Breadcrumb from "@/app/(dashboard)/components/Breadcrumb";

export default async function MonthlySalesPage() {
  const user = await requireUser();
  const scope = clientScopeWhere(user);

  const monthlyBreakdown = await getMonthlyBreakdown(scope);

  const totalSales = monthlyBreakdown.reduce((s, m) => s + m.sales, 0);
  const totalPaid = monthlyBreakdown.reduce((s, m) => s + m.paid, 0);
  const totalRemaining = monthlyBreakdown.reduce((s, m) => s + m.remaining, 0);
  const totalServices = monthlyBreakdown.reduce((s, m) => s + m.count, 0);

  const now = new Date();
  const currentLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Monthly Sales" }]} />
        <h1 className="text-xl font-bold text-zinc-900">Monthly Sales</h1>
        <p className="text-sm text-zinc-500">All-time breakdown, oldest to newest.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Total Services</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{totalServices}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Total Sales</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">£{totalSales.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Total Collected</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">£{totalPaid.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">£{totalRemaining.toFixed(0)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-zinc-800">Month-by-Month Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3 text-right">Services</th>
                <th className="px-5 py-3 text-right">Total Sales</th>
                <th className="px-5 py-3 text-right">Collected</th>
                <th className="px-5 py-3 text-right">Remaining</th>
                <th className="px-5 py-3 text-right">Collection %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {monthlyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">
                    No sales data yet
                  </td>
                </tr>
              )}
              {[...monthlyBreakdown].reverse().map((m) => {
                const isCurrentMonth = m.label === currentLabel;
                const collPct = m.paid > 0 && m.sales > 0 ? Math.round((m.paid / m.sales) * 100) : 0;
                return (
                  <tr
                    key={m.label}
                    className={`transition-colors hover:bg-zinc-50 ${isCurrentMonth ? "bg-cyan-50/40" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isCurrentMonth ? "text-cyan-700" : "text-zinc-800"}`}>
                          {m.label}
                        </span>
                        {isCurrentMonth && (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-600">{m.count}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-zinc-800">£{m.sales.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-emerald-700">£{m.paid.toFixed(2)}</td>
                    <td className={`px-5 py-3.5 text-right font-medium ${m.remaining > 0 ? "text-rose-600" : "text-zinc-400"}`}>
                      £{m.remaining.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full rounded-full ${collPct >= 100 ? "bg-emerald-500" : collPct >= 70 ? "bg-amber-400" : "bg-rose-400"}`}
                            style={{ width: `${Math.min(collPct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${collPct >= 100 ? "text-emerald-600" : collPct >= 70 ? "text-amber-600" : "text-rose-500"}`}>
                          {collPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
