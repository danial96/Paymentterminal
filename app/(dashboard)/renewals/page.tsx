import { requireUser, clientScopeWhere } from "@/lib/scope";
import { getRenewals } from "@/lib/renewals";
import { formatDate } from "@/lib/format";
import { trashService } from "@/app/actions/trash";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Breadcrumb from "@/app/(dashboard)/components/Breadcrumb";
import RenewalsFilter from "./RenewalsFilter";
import ClientStatusSelect from "./ClientStatusSelect";
import { ClientStatusValue } from "@/app/actions/clientStatus";
import MarkRenewedButton from "./MarkRenewedButton";

function daysUntil(date: Date) {
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function renewalBadge(days: number): { cls: string; label: string } {
  if (days < 0) return { cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200", label: "Overdue" };
  if (days <= 7) return { cls: "bg-red-100 text-red-700 ring-1 ring-red-200", label: `${days}d` };
  if (days <= 30) return { cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-200", label: `${days}d` };
  return { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", label: `${days}d` };
}

export default async function RenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; from?: string; to?: string; dateField?: string }>;
}) {
  const { search, status, from, to, dateField } = await searchParams;
  const useEndDate = !dateField || dateField === "end";
  const user = await requireUser();
  const scope = clientScopeWhere(user);

  const [renewals, session] = await Promise.all([
    getRenewals(scope),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "admin";
  const colSpan = isAdmin ? 11 : 10;

  const overdueCount = renewals.filter((r) => r.endDate && daysUntil(r.endDate) < 0).length;
  const dueSoonCount = renewals.filter((r) => r.endDate && daysUntil(r.endDate) >= 0 && daysUntil(r.endDate) <= 30).length;

  // Apply filters client-side on the fetched data
  const filtered = renewals.filter((r) => {
    if (search && !r.client.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === "overdue" && r.endDate && daysUntil(r.endDate) >= 0) return false;
    if (status === "soon" && r.endDate && (daysUntil(r.endDate) < 0 || daysUntil(r.endDate) > 30)) return false;
    if (status === "active" && r.endDate && daysUntil(r.endDate) < 0) return false;
    const dateToFilter = useEndDate ? r.endDate : r.saleDate;
    if (from && dateToFilter && dateToFilter < new Date(from)) return false;
    if (to && dateToFilter && dateToFilter > new Date(to + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Renewals" }]} />
        <h1 className="text-xl font-bold text-zinc-900">Renewals</h1>
        <p className="text-sm text-zinc-500">
          Recurring services with renewal dates, soonest due first.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Renewals</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{renewals.length}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Overdue</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{overdueCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Due in 30 Days</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{dueSoonCount}</p>
        </div>
      </div>

      <RenewalsFilter defaultSearch={search} defaultStatus={status} defaultFrom={from} defaultTo={to} defaultDateField={dateField} />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-zinc-800">All Renewals</h2>
          <span className="text-xs text-zinc-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Purchase Date</th>
                <th className="px-5 py-3">End Date</th>
                <th className="px-5 py-3">Renewal</th>
                <th className="px-5 py-3">Client Status</th>
                {isAdmin && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-5 py-8 text-center text-zinc-400">
                    No renewals found
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const days = r.endDate ? daysUntil(r.endDate) : 0;
                const badge = renewalBadge(days);
                const isOverdue = days < 0;
                const isClosed = r.client.status === "lost";
                return (
                  <tr key={r.id} className={`transition-colors hover:bg-zinc-50 ${isOverdue && !isClosed ? "bg-rose-50/40" : ""} ${isClosed ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <Link href={`/clients/${r.clientId}`} className="font-medium text-zinc-900 hover:text-cyan-700 hover:underline transition-colors">
                        {r.client.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {r.client.phone && (
                          <span className="text-xs text-zinc-600">📞 {r.client.phone}</span>
                        )}
                        {r.client.email && (
                          <span className="text-xs text-zinc-400 truncate max-w-[180px]">✉ {r.client.email}</span>
                        )}
                        {!r.client.phone && !r.client.email && (
                          <span className="text-xs text-zinc-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{r.serviceType.name}</td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs max-w-[220px]">
                      {r.description ? <span className="line-clamp-2">{r.description}</span> : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-zinc-800">£{Number(r.totalAmount).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{formatDate(r.saleDate)}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{formatDate(r.endDate)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                          {isOverdue ? "Overdue" : badge.label}
                        </span>
                        {isOverdue && (
                          <span className="text-[11px] font-medium text-rose-400">
                            {days} days
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <ClientStatusSelect
                        clientId={r.clientId}
                        current={(r.client.status as ClientStatusValue) ?? "new"}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <MarkRenewedButton serviceId={r.id} />
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-center">
                        <form action={trashService.bind(null, r.id, r.clientId)}>
                          <button type="submit" className="text-zinc-300 hover:text-red-500 transition-colors" title="Move to trash">
                            <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                          </button>
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
    </div>
  );
}
