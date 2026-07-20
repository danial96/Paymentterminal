import { searchClients, countClients } from "@/app/actions/clients";
import { trashClient } from "@/app/actions/trash";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRenewals } from "@/lib/renewals";
import { formatDate } from "@/lib/format";
import { requireCrmAccess, clientScopeWhere } from "@/lib/scope";
import MonthFilter from "./MonthFilter";
import ClientsTable from "./ClientsTable";
import Link from "next/link";

function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function renewalBadge(days: number) {
  if (days < 0) return "bg-zinc-900 text-white";
  if (days <= 30) return "bg-zinc-200 text-zinc-700";
  return "bg-zinc-200 text-zinc-600";
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; brand?: string; serviceType?: string;
    frontSeller?: string; pm?: string; remaining?: string;
    dateFrom?: string; dateTo?: string; dueStatus?: string;
    months?: string | string[]; page?: string; sortBy?: string;
  }>;
}) {
  const sp = await searchParams;
  const rawMonths = sp.months ? (Array.isArray(sp.months) ? sp.months : [sp.months]) : [];
  const page = Math.max(1, Number(sp.page ?? 1));
  const filters = {
    q: sp.q,
    brand: sp.brand,
    serviceType: sp.serviceType,
    frontSeller: sp.frontSeller,
    pm: sp.pm,
    remaining: sp.remaining as "has" | "paid" | undefined,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    dueStatus: sp.dueStatus as "overdue" | "soon" | undefined,
    months: rawMonths,
    sortBy: sp.sortBy as "newest" | "oldest" | "name_asc" | "name_desc" | "due_asc" | "due_desc" | undefined,
  };
  const user = await requireCrmAccess();
  const scope = clientScopeWhere(user);
  const [clients, totalCount, session, profiles, renewals, brands, serviceTypes] = await Promise.all([
    searchClients(filters, page),
    countClients(filters),
    auth(),
    prisma.sellerProfile.findMany({ select: { name: true, isFrontSeller: true, isUpseller: true } }),
    getRenewals(scope),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.serviceType.findMany({ orderBy: { name: "asc" } }),
  ]);
  const isAdmin = session?.user?.role === "admin";
  const frontSellerList = profiles.filter((p) => p.isFrontSeller).map((p) => p.name).sort();
  const pmList = Array.from(new Set(clients.flatMap((c) => [c.pmName]).filter(Boolean) as string[])).sort();
  // remaining filter applied client-side in ClientsTable
  const initialClients = filters.remaining
    ? clients.filter((c) => {
        const svcs = (c as { services?: { totalAmount: unknown; payments: { amount: unknown }[] }[] }).services ?? [];
        const total = svcs.reduce((s, sv) => s + Number(sv.totalAmount), 0);
        const paid = svcs.reduce((s, sv) => s + sv.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0);
        return filters.remaining === "has" ? total - paid > 0 : total - paid <= 0;
      })
    : clients;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Clients</h1>
        <div className="flex gap-2">
          <a
            href={`/api/clients/export${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ""}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Export CSV
          </a>
          <Link
            href="/clients/new"
            className="btn-brand rounded-md px-3 py-2 text-sm font-medium text-white"
          >
            Add Client
          </Link>
        </div>
      </div>

      <form className="rounded-lg border border-zinc-200 bg-white p-3 flex flex-wrap gap-2 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1 min-w-[200px] flex-1">
          <label className="text-xs text-zinc-500 font-medium">Search</label>
          <input
            type="text" name="q" defaultValue={filters.q}
            placeholder="Name, email, or phone..."
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        {/* Month multi-select */}
        <MonthFilter selected={rawMonths} />
        {/* Brand */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-zinc-500 font-medium">Brand</label>
          <select name="brand" defaultValue={filters.brand ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none">
            <option value="">All Brands</option>
            {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
        </div>
        {/* Service Type */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs text-zinc-500 font-medium">Service</label>
          <select name="serviceType" defaultValue={filters.serviceType ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none">
            <option value="">All Services</option>
            {serviceTypes.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        {/* Front Seller */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-xs text-zinc-500 font-medium">Front Seller</label>
          <select name="frontSeller" defaultValue={filters.frontSeller ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none">
            <option value="">All Sellers</option>
            {frontSellerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {/* PM */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs text-zinc-500 font-medium">PM</label>
          <select name="pm" defaultValue={filters.pm ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none">
            <option value="">All PMs</option>
            {pmList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {/* Remaining */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-xs text-zinc-500 font-medium">Remaining</label>
          <select name="remaining" defaultValue={filters.remaining ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none">
            <option value="">All</option>
            <option value="has">Has Remaining</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>
        {/* Due Status */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs text-zinc-500 font-medium">Due Status</label>
          <select name="dueStatus" defaultValue={filters.dueStatus ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none">
            <option value="">All</option>
            <option value="overdue">Overdue</option>
            <option value="soon">Due Soon (30d)</option>
          </select>
        </div>
        {/* Date From */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-xs text-zinc-500 font-medium">Date From</label>
          <input type="date" name="dateFrom" defaultValue={filters.dateFrom ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none" />
        </div>
        {/* Date To */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-xs text-zinc-500 font-medium">Date To</label>
          <input type="date" name="dateTo" defaultValue={filters.dateTo ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none" />
        </div>
        {/* Sort By */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs text-zinc-500 font-medium">Sort By</label>
          <select name="sortBy" defaultValue={filters.sortBy ?? ""} className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none">
            <option value="">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name A→Z</option>
            <option value="name_desc">Name Z→A</option>
            <option value="due_asc">Due Date (Soonest)</option>
            <option value="due_desc">Due Date (Latest)</option>
          </select>
        </div>
        {/* Buttons */}
        <div className="flex gap-2 items-end">
          <button type="submit" className="btn-brand rounded-md px-3 py-1.5 text-sm font-medium text-white">
            Filter
          </button>
          <Link href="/clients" className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100">
            Reset
          </Link>
        </div>
      </form>

      <ClientsTable
        initial={initialClients as unknown as Parameters<typeof ClientsTable>[0]["initial"]}
        total={totalCount}
        filtersJson={JSON.stringify(filters)}
        frontSellerNames={frontSellerList}
        upsellerNames={profiles.filter((p) => p.isUpseller).map((p) => p.name)}
        isAdmin={isAdmin}
        trashAction={trashClient}
      />

      {/* Renewals section */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Renewals</h2>
        <div className="rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-500">
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Purchase Date</th>
                <th className="px-4 py-2">End Date</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {renewals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-zinc-400">
                    No renewals on record yet
                  </td>
                </tr>
              )}
              {renewals.map((r) => {
                const days = r.endDate ? daysUntil(r.endDate) : 0;
                return (
                  <tr key={r.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-2">
                      <Link href={`/clients/${r.clientId}`} className="text-zinc-900 hover:underline">
                        {r.client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-zinc-600">{r.description || r.serviceType.name}</td>
                    <td className="px-4 py-2 text-zinc-600">£{Number(r.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-2 text-zinc-600">{formatDate(r.saleDate)}</td>
                    <td className="px-4 py-2 text-zinc-600">{formatDate(r.endDate)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${renewalBadge(days)}`}>
                        {days < 0 ? "Overdue" : `${days} days`}
                      </span>
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
