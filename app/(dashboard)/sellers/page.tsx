import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SellersPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string }>;
}) {
  const { month, tab } = await searchParams;
  const activeTab = tab === "front" ? "front" : tab === "upsells" ? "upsells" : "all";

  const [allServices, profiles] = await Promise.all([
    prisma.clientService.findMany({
      where: {
        deletedAt: null,
        OR: [{ soldByName: { not: null } }, { upsellerName: { not: null } }],
      },
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

  // All services use soldByName as the single source of truth.
  // Tabs filter by profile role (isFrontSeller / isUpseller).
  const servicesWithSeller = allServices.filter((s) => s.soldByName != null);

  // Collect months
  const monthSet = new Set<string>();
  for (const svc of servicesWithSeller) {
    const d = svc.saleDate;
    monthSet.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const allMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  const activeMonth = month && allMonths.includes(month) ? month : allMonths[0] ?? "";

  function toMonthKey(d: Date) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const filtered = activeMonth
    ? servicesWithSeller.filter((svc) => toMonthKey(svc.saleDate) === activeMonth)
    : servicesWithSeller;

  // Build seller map from soldByName
  const sellerMap = new Map<string, { deals: number; totalValue: number; amountPaid: number }>();
  for (const svc of filtered) {
    const name = svc.soldByName!;
    const amount = Number(svc.totalAmount);
    const paid = svc.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const existing = sellerMap.get(name) ?? { deals: 0, totalValue: 0, amountPaid: 0 };
    sellerMap.set(name, {
      deals: existing.deals + 1,
      totalValue: existing.totalValue + amount,
      amountPaid: existing.amountPaid + paid,
    });
  }

  const sellers = Array.from(sellerMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .filter(({ name }) => {
      const p = profileMap.get(name);
      if (p && !p.isActive) return false;
      if (activeTab === "front") {
        // Only show sellers explicitly marked as front sellers
        return p ? p.isFrontSeller : false;
      }
      if (activeTab === "upsells") {
        // Only show sellers explicitly marked as upsellers
        return p ? p.isUpseller : false;
      }
      // "all" tab: show everyone active
      return true;
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  // For badges: use profile flags
  const frontSellerNames = new Set(profiles.filter((p) => p.isFrontSeller).map((p) => p.name));
  const upsellerNames = new Set(profiles.filter((p) => p.isUpseller).map((p) => p.name));

  const totalDeals = sellers.reduce((s, x) => s + x.deals, 0);
  const totalValue = sellers.reduce((s, x) => s + x.totalValue, 0);
  const totalPaid = sellers.reduce((s, x) => s + x.amountPaid, 0);

  function monthLabel(key: string) {
    const [year, mon] = key.split("-");
    const d = new Date(Number(year), Number(mon) - 1, 1);
    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
  }

  function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  const avatarColors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
  ];

  function tabClass(t: string) {
    return `px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === t
        ? "border-zinc-900 text-zinc-900"
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
        <Link
          href="/sellers/manage"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
        >
          ⚙️ Manage Sellers
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 -mb-2">
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
      <div className="flex flex-wrap gap-2 pt-1">
        {allMonths.map((m) => (
          <Link
            key={m}
            href={`/sellers?tab=${activeTab}&month=${m}`}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              m === activeMonth
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:ring-zinc-400"
            }`}
          >
            {monthLabel(m)}
          </Link>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Deals</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{totalDeals}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Value</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">£{totalValue.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Remaining</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            £{(totalValue - totalPaid).toFixed(2)}
          </p>
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
                <th className="border-r border-zinc-200 px-5 py-3">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sellers.map((s, i) => {
                const remaining = s.totalValue - s.amountPaid;
                const profile = profileMap.get(s.name);
                const target = activeTab === "upsells"
                  ? (profile?.upsellTarget ? Number(profile.upsellTarget) : null)
                  : activeTab === "front"
                  ? (profile?.frontTarget ? Number(profile.frontTarget) : null)
                  : (profile?.monthlyTarget ?? profile?.frontTarget ?? profile?.upsellTarget)
                    ? Number(profile?.monthlyTarget ?? profile?.frontTarget ?? profile?.upsellTarget)
                    : null;
                const targetPct = target
                  ? Math.min(Math.round((s.totalValue / target) * 100), 100)
                  : null;
                const color = avatarColors[i % avatarColors.length];
                const isFront = profile?.isFrontSeller ?? frontSellerNames.has(s.name);
                const isUp = profile?.isUpseller ?? upsellerNames.has(s.name);

                return (
                  <tr key={s.name} className="group hover:bg-zinc-50 transition-colors">
                    <td className="border-r border-zinc-100 px-5 py-3.5 font-medium text-zinc-400">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (
                        <span className="text-zinc-300">#{i + 1}</span>
                      )}
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
                          {initials(s.name)}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/sellers/${encodeURIComponent(s.name)}`}
                            className="font-medium text-zinc-900 hover:underline leading-none"
                          >
                            {s.name}
                          </Link>
                          <div className="flex items-center gap-1">
                            {isFront && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                Front
                              </span>
                            )}
                            {isUp && (
                              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                                Upsell
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
                        {s.deals}
                      </span>
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5 font-semibold text-zinc-900">
                      £{s.totalValue.toFixed(2)}
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5 font-medium text-emerald-600">
                      £{s.amountPaid.toFixed(2)}
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5 font-medium text-amber-600">
                      £{remaining.toFixed(2)}
                    </td>
                    <td className="border-r border-zinc-100 px-5 py-3.5">
                      {target !== null && targetPct !== null ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">£{target.toFixed(0)}</span>
                            <span className={`font-semibold ${targetPct >= 100 ? "text-emerald-600" : targetPct >= 70 ? "text-blue-600" : "text-amber-600"}`}>
                              {targetPct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className={`h-full rounded-full transition-all ${targetPct >= 100 ? "bg-emerald-500" : targetPct >= 70 ? "bg-blue-500" : "bg-amber-400"}`}
                              style={{ width: `${targetPct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <Link href="/sellers/manage" className="text-xs text-zinc-400 hover:text-zinc-700 hover:underline">
                          Set target →
                        </Link>
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
