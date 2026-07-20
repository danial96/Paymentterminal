import { prisma } from "@/lib/prisma";
import { upsertSellerProfile } from "@/app/actions/sellers";
import Link from "next/link";
import ManageSellersTable from "./ManageSellersTable";

export default async function ManageSellersPage() {
  const [rawSellers, rawUpsellers, profiles] = await Promise.all([
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
  ]);

  const profileMap = new Map(profiles.map((p) => [p.name, p]));

  const allNames = Array.from(
    new Set([
      ...rawSellers.map((s) => s.soldByName!),
      ...rawUpsellers.map((s) => s.upsellerName!),
      ...profiles.map((p) => p.name),
    ])
  ).sort();

  const rows = allNames.map((name) => {
    const p = profileMap.get(name);
    // fallback to monthlyTarget if role-specific target not set yet
    const legacy = p?.monthlyTarget ? Number(p.monthlyTarget) : null;
    return {
      name,
      isActive: p?.isActive ?? true,
      isFrontSeller: p?.isFrontSeller ?? false,
      isUpseller: p?.isUpseller ?? false,
      frontTarget: p?.frontTarget != null ? Number(p.frontTarget) : legacy,
      upsellTarget: p?.upsellTarget != null ? Number(p.upsellTarget) : legacy,
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

      <ManageSellersTable key={rows.length} initialRows={rows} />
    </div>
  );
}
