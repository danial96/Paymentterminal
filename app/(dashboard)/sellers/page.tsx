import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/scope";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faMedal } from "@fortawesome/free-solid-svg-icons";
import SellerTargetCell from "./SellerTargetCell";
import MonthSelector from "./MonthSelector";

export default async function SellersPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string }>;
}) {
  const { month, tab } = await searchParams;
  await requireAdmin();
  const session = await auth();
  const isAdmin = true;
  const activeTab = tab === "front" ? "front" : tab === "upsells" ? "upsells" : tab === "target" ? "target" : "all";

  const [allServices, profiles] = await Promise.all([
    prisma.clientService.findMany({
      where: { deletedAt: null },
      select: {
        soldByName: true,
        upsellerName: true,
        totalAmount: true,
        saleDate: true,
        payments: { select: { amount: true } },
      },
    }),
    prisma.sellerProfile.findMany(),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.name, p]));

  // Determine active month early so we can fetch monthly targets for it
  const monthSet0 = new Set<string>();
  for (const svc of allServices) {
    const d = svc.saleDate;
    monthSet0.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const allMonths0 = Array.from(monthSet0).sort((a, b) => b.localeCompare(a));
  const resolvedMonth = month && allMonths0.includes(month) ? month : allMonths0[0] ?? "";

  const monthlyTargets = resolvedMonth
    ? await prisma.sellerMonthlyTarget.findMany({ where: { month: resolvedMonth } })
    : [];
  const monthlyTargetMap = new Map(monthlyTargets.map((t) => [t.sellerName, t]));

  // Fetch payments received IN the active month (by paymentDate) — matches dashboard metric
  // Group by soldByName so each seller shows what they collected this month
  const monthPaymentsBySeller = new Map<string, number>();
  let monthPaymentsTotal = 0;
  if (resolvedMonth) {
    const [yr, mo] = resolvedMonth.split("-").map(Number);
    const from = new Date(Date.UTC(yr, mo - 1, 1));
    const to = new Date(Date.UTC(yr, mo, 1));
    const rows = await prisma.payment.findMany({
      where: {
        deletedAt: null,
        paymentDate: { gte: from, lt: to },
        clientService: { deletedAt: null },
      },
      select: {
        amount: true,
        clientService: { select: { soldByName: true, upsellerName: true } },
      },
    });
    for (const r of rows) {
      const amt = Number(r.amount);
      monthPaymentsTotal += amt;
      const seller = r.clientService?.soldByName ?? "Unassigned";
      monthPaymentsBySeller.set(seller, (monthPaymentsBySeller.get(seller) ?? 0) + amt);
    }
  }

  // Collect months from ALL services (including unassigned)
  const monthSet = new Set<string>();
  for (const svc of allServices) {
    const d = svc.saleDate;
    monthSet.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const allMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  const activeMonth = month && allMonths.includes(month) ? month : allMonths[0] ?? "";

  function toMonthKey(d: Date) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const filtered = activeMonth
    ? allServices.filter((svc) => toMonthKey(svc.saleDate) === activeMonth)
    : allServices;

  // Build seller map — unassigned services go under "Unassigned"
  const UNASSIGNED = "Unassigned";
  const sellerMap = new Map<string, { deals: number; totalValue: number; amountPaid: number }>();

  for (const svc of filtered) {
    const name = svc.soldByName ?? UNASSIGNED;
    const amount = Number(svc.totalAmount);
    const paid = svc.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const existing = sellerMap.get(name) ?? { deals: 0, totalValue: 0, amountPaid: 0 };
    sellerMap.set(name, {
      deals: existing.deals + 1,
      totalValue: existing.totalValue + amount,
      amountPaid: existing.amountPaid + paid,
    });
  }

  const frontSellerNames = new Set(profiles.filter((p) => p.isFrontSeller).map((p) => p.name));
  const upsellerNames = new Set(profiles.filter((p) => p.isUpseller).map((p) => p.name));

  // Find each seller's first-ever sale month
  const firstSaleMonthBySeller = new Map<string, string>();
  for (const svc of allServices) {
    if (!svc.soldByName) continue;
    const key = toMonthKey(svc.saleDate);
    const existing = firstSaleMonthBySeller.get(svc.soldByName);
    if (!existing || key < existing) firstSaleMonthBySeller.set(svc.soldByName, key);
  }

  const now2 = new Date();
  const currentMonth = `${now2.getUTCFullYear()}-${String(now2.getUTCMonth() + 1).padStart(2, "0")}`;

  // Add active sellers with 0 deals — only from their first sale month onwards
  // (new sellers with no sales yet show only for current month)
  for (const p of profiles) {
    if (!p.isActive) continue;
    if (sellerMap.has(p.name)) continue;
    const firstMonth = firstSaleMonthBySeller.get(p.name) ?? currentMonth;
    if (activeMonth >= firstMonth) {
      sellerMap.set(p.name, { deals: 0, totalValue: 0, amountPaid: 0 });
    }
  }

  const sellers = Array.from(sellerMap.entries())
    .map(([name, stats]) => {
      const mt = name !== UNASSIGNED ? monthlyTargetMap.get(name) : undefined;
      const target = mt
        ? (activeTab === "upsells"
            ? (mt.upsellTarget ? Number(mt.upsellTarget) : null)
            : activeTab === "front"
            ? (mt.frontTarget ? Number(mt.frontTarget) : null)
            : Number(mt.frontTarget ?? mt.upsellTarget ?? 0) || null)
        : null;
      const collectedInMonth = monthPaymentsBySeller.get(name) ?? 0;
      const targetPct = target ? Math.round((collectedInMonth / target) * 100) : null;
      return { name, ...stats, collectedInMonth, target, targetPct };
    })
    .filter(({ name }) => {
      if (name === UNASSIGNED) return activeTab === "all";
      const p = profileMap.get(name);
      if (p && !p.isActive) return false;
      if (activeTab === "target") return !!(p?.monthlyTarget || p?.frontTarget || p?.upsellTarget);
      if (activeTab === "front") return p ? p.isFrontSeller : false;
      if (activeTab === "upsells") return p ? p.isUpseller : false;
      return true;
    })
    .sort((a, b) => {
      // Sort by % desc — highest percentage at top, no target at bottom
      if (a.targetPct !== null && b.targetPct !== null) return b.targetPct - a.targetPct;
      if (a.targetPct !== null) return -1;
      if (b.targetPct !== null) return 1;
      return b.totalValue - a.totalValue;
    });

  const totalDeals = sellers.reduce((s, x) => s + x.deals, 0);
  const totalValue = sellers.reduce((s, x) => s + x.totalValue, 0);
  const totalPaid = sellers.reduce((s, x) => s + x.amountPaid, 0);

  // For Target Achieve card: use ALL services in the month (including inactive sellers)
  const totalPaidAll = filtered.reduce((sum, svc) => {
    return sum + svc.payments.reduce((p, pay) => p + Number(pay.amount), 0);
  }, 0);

  // Total target for active month (sum of all sellers with a target)
  const totalTarget = Array.from(sellerMap.keys()).reduce((sum, name) => {
    if (name === UNASSIGNED) return sum;
    const mt = monthlyTargetMap.get(name);
    if (!mt) return sum;
    const t = Number(mt.frontTarget ?? mt.upsellTarget ?? 0);
    return sum + t;
  }, 0);

  function monthLabel(key: string) {
    const [year, mon] = key.split("-");
    const d = new Date(Number(year), Number(mon) - 1, 1);
    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
  }

  function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  const avatarPalette = [
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-orange-100 text-orange-700",
  ];

  function tabClass(t: string) {
    return `px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === t
        ? "border-emerald-600 text-emerald-700"
        : "border-transparent text-zinc-400 hover:text-zinc-600"
    }`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Sellers</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {activeMonth ? monthLabel(activeMonth) : "All time"} performance
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/sellers/manage"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            <FontAwesomeIcon icon={faGear} className="h-4 w-4" /> Manage Sellers
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 -mb-2">
        <Link href={`/sellers/manage${activeMonth ? `?month=${activeMonth}` : ""}`} className={tabClass("target")}>
          Target
        </Link>
        <Link href={`/sellers?tab=all${activeMonth ? `&month=${activeMonth}` : ""}`} className={tabClass("all")}>
          All Sales
        </Link>
        <Link href={`/sellers?tab=front${activeMonth ? `&month=${activeMonth}` : ""}`} className={tabClass("front")}>
          Front Sales
        </Link>
        <Link href={`/sellers?tab=upsells${activeMonth ? `&month=${activeMonth}` : ""}`} className={tabClass("upsells")}>
          Upsells
        </Link>
      </div>

      {/* Month selector */}
      <MonthSelector months={allMonths} activeMonth={activeMonth} activeTab={activeTab} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Total Deals</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{totalDeals}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Total Value</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">£{totalValue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-500">Remaining</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            £{(totalValue - totalPaid).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Target Achieve</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">£{monthPaymentsTotal.toFixed(2)}</p>
          {totalTarget > 0 && (() => {
            const pct = Math.round((monthPaymentsTotal / totalTarget) * 100);
            return (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-100">
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-400" : "bg-amber-300"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-amber-600">{pct}%</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">of £{totalTarget.toFixed(0)} target</p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Table */}
      {sellers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center text-sm text-zinc-400">
          No data for this period.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="border-r border-zinc-200 px-5 py-3">Rank</th>
                <th className="border-r border-zinc-200 px-5 py-3">Seller</th>
                <th className="border-r border-zinc-200 px-5 py-3">Deals</th>
                <th className="border-r border-zinc-200 px-5 py-3">Total Value</th>
                <th className="border-r border-zinc-200 px-5 py-3">Collected</th>
                <th className="border-r border-zinc-200 px-5 py-3">Remaining</th>
                <th className="border-r border-zinc-200 px-5 py-3">Target Achieve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sellers.map((s, i) => {
                const remaining = s.totalValue - s.amountPaid;
                const profile = s.name !== UNASSIGNED ? profileMap.get(s.name) : undefined;
                const { target, targetPct } = s;
                const color = s.name === UNASSIGNED
                  ? "bg-zinc-100 text-zinc-400"
                  : avatarPalette[i % avatarPalette.length];
                const isFront = profile?.isFrontSeller ?? frontSellerNames.has(s.name);
                const isUp = profile?.isUpseller ?? upsellerNames.has(s.name);

                const medalColor =
                  i === 0 ? "text-amber-400" :
                  i === 1 ? "text-slate-400" :
                  i === 2 ? "text-orange-400" : "";

                return (
                  <tr key={s.name} className="group hover:bg-emerald-50/40 transition-colors">
                    <td className="border-r border-zinc-100 px-5 py-3.5 font-medium text-zinc-400">
                      {i < 3 ? (
                        <FontAwesomeIcon icon={faMedal} className={`h-4 w-4 ${medalColor}`} />
                      ) : (
                        <span className="text-zinc-300">#{i + 1}</span>
                      )}
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
                          {initials(s.name)}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          {s.name === UNASSIGNED ? (
                            <span className="font-medium text-zinc-400 italic leading-none">Unassigned</span>
                          ) : (
                            <Link
                              href={`/sellers/${encodeURIComponent(s.name)}`}
                              className="font-medium text-zinc-900 hover:underline leading-none"
                            >
                              {s.name}
                            </Link>
                          )}
                          <div className="flex items-center gap-1">
                            {isFront && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Front
                              </span>
                            )}
                            {isUp && (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                Upsell
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        {s.deals}
                      </span>
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5 font-semibold text-zinc-900">
                      £{s.totalValue.toFixed(2)}
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5 font-medium text-emerald-700">
                      £{s.collectedInMonth.toFixed(2)}
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5 font-medium text-zinc-600">
                      £{remaining.toFixed(2)}
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5">
                      {s.name !== UNASSIGNED ? (
                        <SellerTargetCell
                          sellerName={s.name}
                          month={activeMonth}
                          target={target}
                          targetPct={targetPct}
                          amountPaid={s.collectedInMonth}
                          isFrontSeller={profile?.isFrontSeller ?? frontSellerNames.has(s.name)}
                          isUpseller={profile?.isUpseller ?? upsellerNames.has(s.name)}
                          isAdmin={isAdmin}
                        />
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
