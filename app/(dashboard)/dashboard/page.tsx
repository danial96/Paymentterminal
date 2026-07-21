import { requireUser, clientScopeWhere, requireCrmAccess } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { getMonthlyBreakdown } from "@/lib/monthlyBreakdown";
import { getRenewals } from "@/lib/renewals";
import { formatDate } from "@/lib/format";
import { trashService } from "@/app/actions/trash";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

function daysUntil(date: Date) {
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function renewalBadge(days: number) {
  if (days < 0) return "bg-zinc-900 text-white";
  if (days <= 30) return "bg-zinc-200 text-zinc-700";
  return "bg-zinc-200 text-zinc-600";
}

export default async function DashboardPage() {
  const user = await requireCrmAccess();
  const scope = clientScopeWhere(user);
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  // All date math here is UTC-based to match how lib/sync.ts stores dates
  // (Date.UTC) — mixing local-time boundaries with UTC-stored data caused a
  // real month-attribution bug before (see project memory).
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
  const [clients, renewals, totalRenewalsCount, upsellTargets, monthlyBreakdown, totalPayments, currentMonthAccountsCount] =
    await Promise.all([
      prisma.client.findMany({
        where: { ...scope, deletedAt: null },
        select: {
          services: {
            where: { deletedAt: null },
            select: {
              totalAmount: true,
              payments: { where: { deletedAt: null }, select: { amount: true } },
            },
          },
        },
      }),
      getRenewals(scope, 8),
      prisma.clientService.count({
        where: {
          deletedAt: null,
          client: { ...scope, deletedAt: null },
          endDate: { not: null },
          serviceType: { isRecurring: true },
          status: "active",
        },
      }),
      prisma.clientService.findMany({
        where: { deletedAt: null, client: { ...scope, deletedAt: null }, serviceType: { category: { in: ["hosting", "security", "seo"] } } },
        select: { clientId: true, serviceType: { select: { category: true } } },
      }),
      getMonthlyBreakdown(scope, 6),
      prisma.payment.count({
        where: { deletedAt: null, clientService: { deletedAt: null, client: { ...scope, deletedAt: null } } },
      }),
      prisma.clientService.count({
        where: { deletedAt: null, client: { ...scope, deletedAt: null }, isNewAccount: true, saleDate: { gte: startOfMonth, lte: endOfMonth } },
      }),
    ]);

  const categoryLabels: Record<string, string> = {
    hosting: "Hosting",
    security: "GDPR / Website Security",
    seo: "GMB / SEO",
  };

  const totalRemaining = clients
    .flatMap((c) => c.services)
    .reduce((sum, s) => {
      const paid = s.payments.reduce((p, pay) => p + Number(pay.amount), 0);
      return sum + (Number(s.totalAmount) - paid);
    }, 0);

  const currentMonthLabel = now.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  // monthlyBreakdown is ordered oldest -> newest; last entry is the current month.
  const thisMonthSales = monthlyBreakdown[monthlyBreakdown.length - 1]?.sales ?? 0;
  const lastMonthSales = monthlyBreakdown[monthlyBreakdown.length - 2]?.sales ?? 0;

  const scopedClientsWithNames = await prisma.client.findMany({
    where: scope,
    select: { id: true, name: true },
  });

  const missingByType = (["hosting", "security", "seo"] as const).map((category) => {
    const haveIds = new Set(
      upsellTargets
        .filter((cs) => cs.serviceType.category === category)
        .map((cs) => cs.clientId)
    );
    const missing = scopedClientsWithNames.filter((c) => !haveIds.has(c.id));
    return { serviceType: categoryLabels[category], missing };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">All-Time Payments</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{totalPayments}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">{currentMonthLabel} Number of Accounts</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{currentMonthAccountsCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Last Month&apos;s Sales</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            £{lastMonthSales.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">{currentMonthLabel}</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            £{thisMonthSales.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Outstanding Balance</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            £{totalRemaining.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Total Renewals</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{totalRenewalsCount}</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Monthly Breakdown (Last 6 Months)</h2>
          <Link href="/monthly-sales" className="text-sm text-zinc-500 hover:underline">
            Read more &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
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

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Latest Renewals</h2>
          <Link href="/renewals" className="text-sm text-zinc-500 hover:underline">
            Read more &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <th className="border-r border-zinc-200 px-4 py-2">Client</th>
              <th className="border-r border-zinc-200 px-4 py-2">Service</th>
              <th className="border-r border-zinc-200 px-4 py-2">Amount</th>
              <th className="border-r border-zinc-200 px-4 py-2">Purchase Date</th>
              <th className="border-r border-zinc-200 px-4 py-2">End Date</th>
              <th className="border-r border-zinc-200 px-4 py-2">Status</th>
              {isAdmin && <th className="border-r border-zinc-200 px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {renewals.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="border-r border-zinc-100 px-4 py-4 text-center text-zinc-400">
                  No renewals on record yet
                </td>
              </tr>
            )}
            {renewals.map((r) => {
              const days = r.endDate ? daysUntil(r.endDate) : 0;
              return (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="border-r border-zinc-100 px-4 py-2">
                    <Link href={`/clients/${r.clientId}`} className="text-zinc-900 hover:underline">
                      {r.client.name}
                    </Link>
                  </td>
                  <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">{r.description || r.serviceType.name}</td>
                  <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">£{Number(r.totalAmount).toFixed(2)}</td>
                  <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">{formatDate(r.saleDate)}</td>
                  <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">{formatDate(r.endDate)}</td>
                  <td className="border-r border-zinc-100 px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${renewalBadge(days)}`}>
                      {days < 0 ? "Overdue" : `${days} days`}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="border-r border-zinc-100 px-4 py-2">
                      <form action={trashService.bind(null, r.id, r.clientId)}>
                        <button type="submit" className="text-zinc-300 hover:text-red-500 transition-colors" title="Move to trash"><FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" /></button>
                      </form>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Upsell Opportunities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          {missingByType.map((group) => (
            <div key={group.serviceType}>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                Missing {group.serviceType}
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {group.missing.length === 0 && (
                  <li className="text-zinc-400">Everyone has this</li>
                )}
                {group.missing.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <Link href={`/clients/${c.id}`} className="text-zinc-700 hover:underline">
                      {c.name}
                    </Link>
                  </li>
                ))}
                {group.missing.length > 8 && (
                  <li className="text-zinc-400">+{group.missing.length - 8} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
