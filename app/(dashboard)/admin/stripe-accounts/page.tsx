import { prisma } from "@/lib/prisma";
import { createStripeAccount } from "@/app/actions/invoices";
import { requireAdmin } from "@/lib/scope";
import StripeAccountCard from "./StripeAccountCard";

export default async function StripeAccountsPage() {
  await requireAdmin();
  const [accounts, brands] = await Promise.all([
    prisma.stripeAccount.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Stripe Accounts</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Add test and live keys separately. Toggle mode per account.</p>
      </div>

      {/* Add form */}
      <form action={createStripeAccount} className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-800">Add New Stripe Account</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Account Name</label>
            <input name="name" required placeholder="e.g. Digi Design Lab" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Brand (optional)</label>
            <select name="brandId" className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
              <option value="">— No brand —</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {/* Test Keys */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">TEST MODE</span>
            <span className="text-xs text-zinc-600">Use these for testing — no real charges</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Test Secret Key (sk_test_...)</label>
              <input name="secretKeyTest" type="password" placeholder="sk_test_..." className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Test Publishable Key (pk_test_...)</label>
              <input name="publishableKeyTest" placeholder="pk_test_..." className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
          </div>
        </div>

        {/* Live Keys */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">LIVE MODE</span>
            <span className="text-xs text-zinc-700">Real payments — use with caution</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Live Secret Key (sk_live_...)</label>
              <input name="secretKeyLive" type="password" placeholder="sk_live_..." className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Live Publishable Key (pk_live_...)</label>
              <input name="publishableKeyLive" placeholder="pk_live_..." className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
          </div>
        </div>

        <button className="btn-brand self-start rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors">
          Add Stripe Account
        </button>
      </form>

      {/* Accounts list */}
      {accounts.length > 0 && (
        <div className="flex flex-col gap-3">
          {accounts.map((a) => {
            const brand = brands.find((b) => b.id === a.brandId);
            return (
              <StripeAccountCard
                key={a.id}
                account={{
                  id: a.id,
                  name: a.name,
                  mode: a.mode,
                  secretKeyTest: a.secretKeyTest,
                  publishableKeyTest: a.publishableKeyTest,
                  secretKeyLive: a.secretKeyLive,
                  publishableKeyLive: a.publishableKeyLive,
                }}
                brandName={brand?.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
