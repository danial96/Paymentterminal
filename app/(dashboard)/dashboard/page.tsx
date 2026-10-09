import { requireUser, clientScopeWhere, requireCrmAccess, isSeller } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { getMonthlyBreakdown } from "@/lib/monthlyBreakdown";
import { getRenewals } from "@/lib/renewals";
import { formatDate } from "@/lib/format";
import { trashService } from "@/app/actions/trash";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import PeriodSelector from "@/app/(dashboard)/components/PeriodSelector";

function daysUntil(date: Date) {
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function periodDates(period: string, now: Date): { from: Date; to: Date; prevFrom: Date; prevTo: Date; label: string } {
  const to = new Date(now);
  let from: Date;
  let ms: number;
  switch (period) {
    case "3m": ms = 90 * 86400000; break;
    case "6m": ms = 182 * 86400000; break;
    case "1y": ms = 365 * 86400000; break;
    case "all": return {
      from: new Date(0), to, prevFrom: new Date(0), prevTo: new Date(0), label: "All Time",
    };
    default: ms = 30 * 86400000; break; // 1m
  }
  from = new Date(to.getTime() - ms);
  const prevTo = new Date(from);
  const prevFrom = new Date(prevTo.getTime() - ms);
  const labelMap: Record<string, string> = { "1m": "Last 30 Days", "3m": "Last 3 Months", "6m": "Last 6 Months", "1y": "Last Year" };
  return { from, to, prevFrom, prevTo, label: labelMap[period] ?? "Last 30 Days" };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = ["1m","3m","6m","1y","all"].includes(rawPeriod ?? "") ? (rawPeriod as string) : "1m";
  const user = await requireCrmAccess();
  const scope = clientScopeWhere(user);
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const isSellerUser = isSeller(user);

  const now = new Date();
  const { from, to, prevFrom, prevTo, label: periodLabel } = periodDates(period, now);
  const isAllTime = period === "all";

  // Current month bounds (always needed for leaderboard/target)
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  const dateFilter = isAllTime ? {} : { gte: from, lte: to };
  const prevDateFilter = isAllTime ? {} : { gte: prevFrom, lte: prevTo };

  const [
    renewals, totalRenewalsCount, upsellTargets, monthlyBreakdown,
    totalClients, overdueRenewals,
    // Period stats (current)
    periodRevenue, periodNewClients, periodServices, periodAvgDeal,
    periodOutstanding,
    // Period stats (previous — for comparison)
    prevRevenue, prevNewClients, prevServices, prevAvgDeal,
  ] = await Promise.all([
    getRenewals(scope, 8),
    prisma.clientService.count({
      where: { deletedAt: null, client: { ...scope, deletedAt: null }, endDate: { not: null }, serviceType: { isRecurring: true }, status: "active" },
    }),
    prisma.clientService.findMany({
      where: { deletedAt: null, client: { ...scope, deletedAt: null }, serviceType: { category: { in: ["hosting", "security", "seo"] } } },
      select: { clientId: true, serviceType: { select: { category: true } } },
    }),
    getMonthlyBreakdown(scope),
    prisma.client.count({ where: { ...scope, deletedAt: null } }),
    prisma.clientService.count({
      where: { deletedAt: null, client: { ...scope, deletedAt: null }, serviceType: { isRecurring: true }, status: "active", endDate: { lt: now } },
    }),
    // Current period: revenue (payments received)
    prisma.payment.aggregate({
      where: { deletedAt: null, paymentDate: dateFilter, clientService: { deletedAt: null, client: { ...scope, deletedAt: null } } },
      _sum: { amount: true },
    }),
    // Current period: new clients
    prisma.client.count({ where: { ...scope, deletedAt: null, createdAt: dateFilter } }),
    // Current period: services sold
    prisma.clientService.count({
      where: { deletedAt: null, client: { ...scope, deletedAt: null }, ...(isAllTime ? {} : { saleDate: dateFilter }) },
    }),
    // Current period: avg deal
    prisma.clientService.aggregate({
      where: { deletedAt: null, client: { ...scope, deletedAt: null }, ...(isAllTime ? {} : { saleDate: dateFilter }) },
      _avg: { totalAmount: true },
    }),
    // Outstanding: all unpaid across all time
    prisma.clientService.findMany({
      where: { deletedAt: null, client: { ...scope, deletedAt: null } },
      select: { totalAmount: true, payments: { where: { deletedAt: null }, select: { amount: true } } },
    }),
    // Previous period: revenue
    isAllTime ? Promise.resolve({ _sum: { amount: null } }) : prisma.payment.aggregate({
      where: { deletedAt: null, paymentDate: prevDateFilter, clientService: { deletedAt: null, client: { ...scope, deletedAt: null } } },
      _sum: { amount: true },
    }),
    // Previous period: new clients
    isAllTime ? Promise.resolve(0) : prisma.client.count({ where: { ...scope, deletedAt: null, createdAt: prevDateFilter } }),
    // Previous period: services
    isAllTime ? Promise.resolve(0) : prisma.clientService.count({
      where: { deletedAt: null, client: { ...scope, deletedAt: null }, saleDate: prevDateFilter },
    }),
    // Previous period: avg deal
    isAllTime ? Promise.resolve({ _avg: { totalAmount: null } }) : prisma.clientService.aggregate({
      where: { deletedAt: null, client: { ...scope, deletedAt: null }, saleDate: prevDateFilter },
      _avg: { totalAmount: true },
    }),
  ]);

  // Period stats computed values
  const currRevenue = Number(periodRevenue._sum.amount ?? 0);
  const prevRevenueVal = Number((prevRevenue as any)._sum?.amount ?? 0);
  const currAvgDeal = Number(periodAvgDeal._avg.totalAmount ?? 0);
  const prevAvgDealVal = Number((prevAvgDeal as any)._avg?.totalAmount ?? 0);
  const prevServicesVal = typeof prevServices === "number" ? prevServices : 0;
  const prevNewClientsVal = typeof prevNewClients === "number" ? prevNewClients : 0;

  const totalOutstanding = periodOutstanding.reduce((s, svc) => {
    const paid = svc.payments.reduce((p, pay) => p + Number(pay.amount), 0);
    return s + Math.max(0, Number(svc.totalAmount) - paid);
  }, 0);
  const totalSalesValue2 = periodOutstanding.reduce((s, svc) => s + Number(svc.totalAmount), 0);
  const collectionRate = totalSalesValue2 > 0 ? Math.round(((totalSalesValue2 - totalOutstanding) / totalSalesValue2) * 100) : 0;

  const revenueChange = isAllTime ? null : pctChange(currRevenue, prevRevenueVal);
  const newClientsChange = isAllTime ? null : pctChange(periodNewClients, prevNewClientsVal);
  const servicesChange = isAllTime ? null : pctChange(periodServices, prevServicesVal);
  const avgDealChange = isAllTime ? null : pctChange(currAvgDeal, prevAvgDealVal);

  const categoryLabels: Record<string, string> = {
    hosting: "Hosting",
    security: "GDPR / Website Security",
    seo: "GMB / SEO",
  };

  const currentMonthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  // monthlyBreakdown is ordered oldest -> newest
  const thisMonthSales = monthlyBreakdown[monthlyBreakdown.length - 1]?.paid ?? 0;
  const lastMonthSales = monthlyBreakdown[monthlyBreakdown.length - 2]?.paid ?? 0;
  const totalRemaining = totalOutstanding;

  const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  // Leaderboard — current month payments by seller (all sellers, unscoped — for ranking)
  const leaderboardPayments = await prisma.payment.findMany({
    where: {
      deletedAt: null,
      paymentDate: { gte: startOfMonth, lte: endOfMonth },
      clientService: { deletedAt: null },
    },
    select: { amount: true, clientService: { select: { soldByName: true, upsellerName: true } } },
  });
  const leaderboardMap = new Map<string, number>();
  for (const p of leaderboardPayments) {
    const name = p.clientService?.soldByName ?? p.clientService?.upsellerName;
    if (!name) continue;
    leaderboardMap.set(name, (leaderboardMap.get(name) ?? 0) + Number(p.amount));
  }
  // Fetch targets for current month for all sellers
  const allMonthlyTargets = await prisma.sellerMonthlyTarget.findMany({ where: { month: currentMonthKey } });
  const targetByName = new Map(allMonthlyTargets.map((t) => [t.sellerName, Number(t.frontTarget ?? t.upsellTarget ?? 0)]));

  const leaderboard = Array.from(leaderboardMap.entries())
    .map(([name, total]) => {
      const target = targetByName.get(name) ?? 0;
      const pct = target > 0 ? Math.min(Math.round((total / target) * 100), 999) : null;
      return { name, total, target, pct };
    })
    .sort((a, b) => {
      // Sort by % desc first, then by total amount desc
      if (a.pct !== null && b.pct !== null) return b.pct - a.pct;
      if (a.pct !== null) return -1;
      if (b.pct !== null) return 1;
      return b.total - a.total;
    })
    .slice(0, 5);

  // Current user's own target (if seller)
  const myTarget = isSellerUser
    ? await prisma.sellerMonthlyTarget.findFirst({ where: { sellerName: user.name ?? "", month: currentMonthKey } })
    : null;
  const myCollected = isSellerUser
    ? leaderboardMap.get(user.name ?? "") ?? 0
    : 0;

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
    <div className="flex flex-col gap-5">

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 shadow-xl">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-20 h-40 w-40 rounded-full bg-cyan-500/15 blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          {/* Left: title + period label */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Analytics Overview</p>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-xs text-slate-400">{periodLabel} &nbsp;·&nbsp; {totalClients.toLocaleString()} clients total</p>
          </div>

          {/* Centre: big revenue hero */}
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Revenue</p>
            <p className="mt-0.5 text-4xl font-black tracking-tight text-white">£{currRevenue.toLocaleString()}</p>
            {revenueChange !== null && (
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${revenueChange >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                {revenueChange >= 0 ? "▲" : "▼"} {Math.abs(revenueChange)}% vs prev
              </span>
            )}
          </div>

          {/* Right: period selector */}
          <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 backdrop-blur-sm">
            {[["1m","1M"],["3m","3M"],["6m","6M"],["1y","1Y"],["all","All"]].map(([key, label]) => (
              <a key={key} href={`?period=${key}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${period === key ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

        {/* New Clients */}
        {(() => {
          const chg = newClientsChange;
          return (
            <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md hover:-translate-y-0.5">
              <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-base">👥</div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">New Clients</p>
              <p className="mt-3 text-3xl font-black text-zinc-900">{periodNewClients}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">acquired</p>
              {chg !== null && (
                <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${chg >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                  {chg >= 0 ? "▲" : "▼"} {Math.abs(chg)}%
                </div>
              )}
            </div>
          );
        })()}

        {/* Services Sold */}
        {(() => {
          const chg = servicesChange;
          return (
            <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md hover:-translate-y-0.5">
              <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-base">🛒</div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Services</p>
              <p className="mt-3 text-3xl font-black text-zinc-900">{periodServices}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">sold</p>
              {chg !== null && (
                <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${chg >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                  {chg >= 0 ? "▲" : "▼"} {Math.abs(chg)}%
                </div>
              )}
            </div>
          );
        })()}

        {/* Avg Deal */}
        {(() => {
          const chg = avgDealChange;
          return (
            <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md hover:-translate-y-0.5">
              <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-base">💷</div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Avg Deal</p>
              <p className="mt-3 text-3xl font-black text-zinc-900">£{currAvgDeal.toFixed(0)}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">per service</p>
              {chg !== null && (
                <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${chg >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                  {chg >= 0 ? "▲" : "▼"} {Math.abs(chg)}%
                </div>
              )}
            </div>
          );
        })()}

        {/* Collection Rate */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md hover:-translate-y-0.5">
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-base">📊</div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Collected</p>
          <p className={`mt-3 text-3xl font-black ${collectionRate >= 80 ? "text-emerald-600" : collectionRate >= 60 ? "text-amber-500" : "text-rose-600"}`}>
            {collectionRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-400">collection rate</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div className={`h-full rounded-full transition-all ${collectionRate >= 80 ? "bg-emerald-400" : collectionRate >= 60 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${collectionRate}%` }} />
          </div>
        </div>

        {/* Outstanding */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md hover:-translate-y-0.5">
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-base">⏳</div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Outstanding</p>
          <p className="mt-3 text-3xl font-black text-zinc-900">£{Math.round(totalOutstanding).toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">unpaid balance</p>
          {overdueRenewals > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-500">
              ⚠ {overdueRenewals} overdue
            </div>
          )}
        </div>
      </div>

      {/* ── MONTH COMPARISON ROW ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Last Month */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md hover:-translate-y-0.5">
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg">📅</div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Last Month</p>
          <p className="mt-3 text-4xl font-black text-zinc-800">£{Math.round(lastMonthSales).toLocaleString()}</p>
          <p className="mt-1 text-xs text-zinc-400">collected</p>
          {lastMonthSales > 0 && thisMonthSales > 0 && (() => {
            const diff = Math.round(((thisMonthSales - lastMonthSales) / lastMonthSales) * 100);
            return (
              <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${diff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                This month is {diff >= 0 ? "▲" : "▼"} {Math.abs(diff)}% {diff >= 0 ? "higher" : "lower"}
              </div>
            );
          })()}
        </div>

        {/* This Month */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 shadow-md text-white transition hover:shadow-lg hover:-translate-y-0.5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-6 left-8 h-16 w-16 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">This Month</p>
            <p className="mt-3 text-4xl font-black text-white">£{Math.round(thisMonthSales).toLocaleString()}</p>
            <p className="mt-1 text-xs text-emerald-200">{currentMonthLabel}</p>
            {lastMonthSales > 0 && thisMonthSales > 0 && (() => {
              const diff = Math.round(((thisMonthSales - lastMonthSales) / lastMonthSales) * 100);
              return (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {diff >= 0 ? "▲" : "▼"} {Math.abs(diff)}% vs last month
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* My Target + Leaderboard — shown right after stat cards */}
      {(isSellerUser && myTarget) || leaderboard.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* My Target */}
          {isSellerUser && myTarget && (() => {
            const target = Number(myTarget.frontTarget ?? myTarget.upsellTarget ?? 0);
            const pct = target > 0 ? Math.min(Math.round((myCollected / target) * 100), 100) : 0;
            const barColor = pct >= 100 ? "from-emerald-400 to-emerald-500" : pct >= 70 ? "from-violet-400 to-violet-600" : pct >= 40 ? "from-amber-400 to-orange-500" : "from-rose-400 to-rose-500";
            const statusLabel = pct >= 100 ? "🎉 Target Hit!" : pct >= 70 ? "🔥 Almost there" : pct >= 40 ? "📈 Keep going" : "🚀 Just started";
            return (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-6 text-white shadow-lg">
                <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">My Target</p>
                      <p className="mt-0.5 text-sm text-violet-200">{currentMonthLabel}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">{statusLabel}</span>
                  </div>
                  <div className="mt-4 flex items-end gap-3">
                    <p className="text-4xl font-extrabold tracking-tight">£{myCollected.toFixed(0)}</p>
                    <p className="mb-1 text-sm text-violet-300">/ £{target.toFixed(0)}</p>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-violet-300">Progress</span>
                      <span className="text-sm font-bold">{pct}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor} shadow-sm transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-violet-300">
                    <span>Remaining: <span className="font-semibold text-white">£{Math.max(0, target - myCollected).toFixed(0)}</span></span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
                <h2 className="text-sm font-bold text-zinc-900">🏆 Top Performers</h2>
                <span className="text-xs text-zinc-400">{currentMonthLabel}</span>
              </div>
              <div className="divide-y divide-zinc-50">
                {leaderboard.map((s, i) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const isMe = s.name === user.name;
                  const barW = s.pct !== null ? Math.min(s.pct, 100) : 0;
                  const barColor = s.pct === null ? "bg-zinc-200" : s.pct >= 100 ? "bg-emerald-400" : s.pct >= 70 ? "bg-amber-400" : s.pct >= 40 ? "bg-orange-400" : "bg-rose-400";
                  return (
                    <div key={s.name} className={`px-5 py-3 ${isMe ? "bg-violet-50" : "hover:bg-zinc-50/70"} transition-colors`}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="w-6 text-center text-base shrink-0">{medals[i] ?? `#${i + 1}`}</span>
                        <span className={`flex-1 text-sm font-semibold ${isMe ? "text-violet-700" : "text-zinc-800"}`}>
                          {s.name}
                          {isMe && <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">You</span>}
                        </span>
                        <span className="text-xs font-semibold text-zinc-400">
                          {s.pct !== null ? `${s.pct}%` : "—"}
                        </span>
                      </div>
                      <div className="ml-9 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${barW}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mini Revenue Chart — last 6 months */}
          {(() => {
            const bars = [...monthlyBreakdown].reverse().slice(0, 6).reverse();
            const maxVal = Math.max(...bars.map(b => b.paid), 1);
            return (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm self-start">
                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
                  <h2 className="text-sm font-bold text-zinc-900">📈 Revenue Trend</h2>
                  <span className="text-xs text-zinc-400">Last 6 months</span>
                </div>
                <div className="px-5 py-4">
                  {/* Row 1: amount labels */}
                  <div className="flex gap-2 mb-1">
                    {bars.map((m) => (
                      <div key={m.label} className="flex-1 text-center text-[9px] font-bold text-zinc-500">
                        £{Math.round(m.paid).toLocaleString()}
                      </div>
                    ))}
                  </div>
                  {/* Row 2: bars — bottom aligned */}
                  <div className="flex items-end gap-2" style={{ height: "64px" }}>
                    {bars.map((m, i) => {
                      const barH = Math.max(Math.round((m.paid / maxVal) * 64), 4);
                      const isLast = i === bars.length - 1;
                      return (
                        <div
                          key={m.label}
                          className={`flex-1 rounded-t-lg ${isLast ? "bg-emerald-400" : "bg-violet-200"}`}
                          style={{ height: `${barH}px` }}
                        />
                      );
                    })}
                  </div>
                  {/* Row 3: month labels */}
                  <div className="flex gap-2 mt-1.5">
                    {bars.map((m) => (
                      <div key={m.label} className="flex-1 text-center text-[9px] text-zinc-400">
                        {m.label.split(" ")[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}

      {/* Bottom: Monthly + Renewals side by side, then Upsell full width */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Monthly Breakdown */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Monthly Breakdown</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">3-month rolling avg shown per row</p>
            </div>
            <Link href="/monthly-sales" className="text-xs font-medium text-cyan-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-400 uppercase tracking-wide">
                  <th className="px-5 py-2 text-left font-semibold">Month</th>
                  <th className="px-4 py-2 text-right font-semibold">Collected</th>
                  <th className="px-4 py-2 text-right font-semibold">3M Avg</th>
                  <th className="px-4 py-2 text-right font-semibold">Remaining</th>
                  <th className="px-5 py-2 text-right font-semibold">Svcs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {(() => {
                  const reversed = [...monthlyBreakdown].reverse();
                  return reversed.map((m, i) => {
                    // 3-month rolling average: current + 2 previous (in reversed = i, i+1, i+2)
                    const slice = reversed.slice(i, i + 3);
                    const avg = slice.reduce((s, x) => s + x.paid, 0) / slice.length;
                    const trend = i > 0 ? m.paid - reversed[i - 1].paid : null;
                    return (
                      <tr key={m.label} className={`transition-colors ${i === 0 ? "bg-cyan-50/30" : "hover:bg-zinc-50"}`}>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-800">{m.label}</span>
                            {i === 0 && <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] font-bold text-cyan-700">Now</span>}
                          </div>
                          {trend !== null && (
                            <span className={`text-[10px] font-medium ${trend >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
                              {trend >= 0 ? "▲" : "▼"} £{Math.abs(trend).toFixed(0)} vs prev
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">£{m.paid.toFixed(0)}</td>
                        <td className="px-4 py-2.5 text-right text-zinc-500 font-medium">£{avg.toFixed(0)}</td>
                        <td className={`px-4 py-2.5 text-right font-medium ${m.remaining > 0 ? "text-rose-500" : "text-zinc-300"}`}>
                          {m.remaining > 0 ? `-£${m.remaining.toFixed(0)}` : "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right text-zinc-400">{m.count}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
            <h2 className="text-sm font-bold text-zinc-900">Upcoming Renewals</h2>
            <Link href="/renewals" className="text-xs font-medium text-cyan-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {renewals.length === 0 && (
              <p className="px-5 py-8 text-center text-xs text-zinc-400">No renewals on record yet</p>
            )}
            {renewals.map((r) => {
              const days = r.endDate ? daysUntil(r.endDate) : 0;
              const isOverdue = days < 0;
              const badgeCls = isOverdue ? "bg-rose-100 text-rose-600"
                : days <= 7 ? "bg-red-100 text-red-600"
                : days <= 30 ? "bg-amber-100 text-amber-700"
                : "bg-emerald-50 text-emerald-700";
              return (
                <div key={r.id} className={`flex items-center gap-3 px-5 py-2.5 ${isOverdue ? "bg-rose-50/20" : "hover:bg-zinc-50"} transition-colors`}>
                  <div className="flex-1 min-w-0">
                    <Link href={`/clients/${r.clientId}`} className="block text-xs font-semibold text-zinc-800 hover:text-cyan-700 truncate">{r.client.name}</Link>
                    <span className="text-[11px] text-zinc-400 truncate block">{r.description || r.serviceType.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-zinc-700">£{Number(r.totalAmount).toFixed(0)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeCls}`}>
                      {isOverdue ? "Overdue" : `${days}d`}
                    </span>
                    {isAdmin && (
                      <form action={trashService.bind(null, r.id, r.clientId)}>
                        <button type="submit" className="text-zinc-200 hover:text-red-400 transition-colors"><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Upsell Opportunities — full width, compact 3-col cards */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-3.5">
          <h2 className="text-sm font-bold text-zinc-900">💡 Upsell Opportunities</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Clients without recurring services</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          {missingByType.map((group) => (
            <div key={group.serviceType} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{group.serviceType}</span>
                {group.missing.length > 0
                  ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{group.missing.length} clients</span>
                  : <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">✓ All set</span>
                }
              </div>
              {group.missing.length === 0 ? (
                <p className="text-xs text-zinc-400">All clients have this service.</p>
              ) : (
                <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {group.missing.map((c) => (
                    <li key={c.id}>
                      <Link href={`/clients/${c.id}`} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-cyan-700 transition-colors group">
                        <span className="h-1 w-1 rounded-full bg-zinc-300 group-hover:bg-cyan-400 shrink-0" />
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
