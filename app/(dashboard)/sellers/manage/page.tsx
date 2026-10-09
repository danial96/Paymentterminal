import { prisma } from "@/lib/prisma";
import { upsertSellerProfile } from "@/app/actions/sellers";
import Link from "next/link";
import ManageSellersTable from "./ManageSellersTable";
import { requireAdmin } from "@/lib/scope";

export default async function ManageSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();
  const { month } = await searchParams;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = month ?? currentMonth;

  // Previous month for fallback
  const [year, mon] = selectedMonth.split("-").map(Number);
  const prevDate = new Date(year, mon - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const [rawSellers, rawUpsellers, profiles, currentTargets, prevTargets] = await Promise.all([
    prisma.clientService.findMany({
      where: { soldByName: { not: null } },
      select: { soldByName: true },
      distinct: ["soldByName"],
    }),
    prisma.clientService.findMany({
      where: { upsellerName: { not: null } },
      select: { upsellerName: true },
      distinct: ["upsellerName"],
    }),
    prisma.sellerProfile.findMany(),
    prisma.sellerMonthlyTarget.findMany({ where: { month: selectedMonth } }),
    prisma.sellerMonthlyTarget.findMany({ where: { month: prevMonth } }),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.name, p]));
  const currentTargetMap = new Map(currentTargets.map((t) => [t.sellerName, t]));
  const prevTargetMap = new Map(prevTargets.map((t) => [t.sellerName, t]));

  const allNames = Array.from(
    new Set([
      ...rawSellers.map((s) => s.soldByName!),
      ...rawUpsellers.map((s) => s.upsellerName!),
      ...profiles.map((p) => p.name),
    ])
  ).sort();

  const rows = allNames.map((name) => {
    const p = profileMap.get(name);
    // For targets: use current month record → fallback to previous month record → null
    const ct = currentTargetMap.get(name);
    const pt = prevTargetMap.get(name);
    const frontTarget = ct?.frontTarget != null
      ? Number(ct.frontTarget)
      : pt?.frontTarget != null
      ? Number(pt.frontTarget)
      : null;
    const upsellTarget = ct?.upsellTarget != null
      ? Number(ct.upsellTarget)
      : pt?.upsellTarget != null
      ? Number(pt.upsellTarget)
      : null;
    return {
      name,
      isActive: p?.isActive ?? true,
      isFrontSeller: p?.isFrontSeller ?? false,
      isUpseller: p?.isUpseller ?? false,
      frontTarget,
      upsellTarget,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/sellers" className="text-sm text-zinc-400 hover:text-zinc-700">
          ← Sellers
        </Link>
        <h1 className="mt-1 text-xl font-bold text-zinc-900">Manage Sellers</h1>
        <p className="text-sm text-zinc-500">
          Set roles, toggle visibility, and update monthly targets
        </p>
      </div>

      {/* Add new seller */}
      <form
        action={upsertSellerProfile}
        className="flex items-end gap-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-600">Seller Name</label>
          <input
            name="name"
            required
            placeholder="e.g. Ali"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <button className="btn-brand rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors">
          Add Seller
        </button>
      </form>

      <ManageSellersTable
        key={`${selectedMonth}-${rows.length}`}
        initialRows={rows}
        selectedMonth={selectedMonth}
        currentMonth={currentMonth}
      />
    </div>
  );
}
