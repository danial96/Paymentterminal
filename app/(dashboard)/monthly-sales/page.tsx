import { requireUser, clientScopeWhere } from "@/lib/scope";
import { getMonthlyBreakdown } from "@/lib/monthlyBreakdown";
import Link from "next/link";

export default async function MonthlySalesPage() {
  const user = await requireUser();
  const scope = clientScopeWhere(user);

  const monthlyBreakdown = await getMonthlyBreakdown(scope);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
      <h1 className="text-lg font-semibold text-zinc-900">Monthly Sales</h1>
      <p className="text-sm text-zinc-500">Every month with sales activity, oldest to newest.</p>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <th className="border-r border-zinc-200 px-4 py-2">Month</th>
              <th className="border-r border-zinc-200 px-4 py-2">Services Sold</th>
              <th className="border-r border-zinc-200 px-4 py-2">Total Sales</th>
              <th className="border-r border-zinc-200 px-4 py-2">Amount Paid</th>
              <th className="border-r border-zinc-200 px-4 py-2">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {monthlyBreakdown.length === 0 && (
              <tr>
                <td colSpan={5} className="border-r border-zinc-100 px-4 py-4 text-center text-zinc-400">
                  No sales data yet
                </td>
              </tr>
            )}
            {monthlyBreakdown.map((m) => (
              <tr key={m.label} className="border-b border-zinc-100 last:border-0">
                <td className="border-r border-zinc-100 px-4 py-2 text-zinc-900">{m.label}</td>
                <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">{m.count}</td>
                <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">£{m.sales.toFixed(2)}</td>
                <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">£{m.paid.toFixed(2)}</td>
                <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">£{m.remaining.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
