import { requireUser, clientScopeWhere } from "@/lib/scope";
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

export default async function RenewalsPage() {
  const user = await requireUser();
  const scope = clientScopeWhere(user);

  const [renewals, session] = await Promise.all([
    getRenewals(scope),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "admin";
  const colSpan = isAdmin ? 7 : 6;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        &larr; Back to Dashboard
      </Link>
      <h1 className="text-lg font-semibold text-zinc-900">Renewals</h1>
      <p className="text-sm text-zinc-500">
        Every recurring service (hosting, domain, SEO, etc.) with a renewal date, soonest due first.
      </p>

      <div className="rounded-lg border border-zinc-200 bg-white">
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
                <td colSpan={colSpan} className="border-r border-zinc-100 px-4 py-4 text-center text-zinc-400">
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
                        <button
                          type="submit"
                          className="text-zinc-300 hover:text-red-500 transition-colors"
                          title="Move to trash"
                        >
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
  );
}
