import { prisma } from "@/lib/prisma";
import { triggerSync } from "@/app/actions/sync";
import { formatDateTime } from "@/lib/format";

export default async function SyncPage() {
  let lastLog = null;
  let dbError: string | null = null;
  try {
    lastLog = await prisma.syncLog.findFirst({ orderBy: { ranAt: "desc" } });
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }
  const warnings = (lastLog?.warnings as string[] | null) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Google Sheet Sync</h1>
        <form action={triggerSync}>
          <button
            type="submit"
            className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            Sync Now
          </button>
        </form>
      </div>

      {dbError && (
        <pre className="rounded-md bg-zinc-100 p-4 text-xs text-zinc-700 overflow-auto">{dbError}</pre>
      )}

      <p className="text-sm text-zinc-500">
        Pulls rows one-directionally from the Google Sheet into the CRM (Sheet → CRM only). Also
        runs automatically once a day via Windows Task Scheduler.
      </p>

      {!lastLog && (
        <p className="text-sm text-zinc-400">No sync has run yet.</p>
      )}

      {lastLog && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-500">Last run</p>
          <p className="mb-4 text-sm text-zinc-900">{formatDateTime(lastLog.ranAt)}</p>

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Rows Processed</p>
              <p className="text-lg font-semibold text-zinc-900">{lastLog.rowsProcessed}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Clients Created</p>
              <p className="text-lg font-semibold text-zinc-900">{lastLog.clientsCreated}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Clients Updated</p>
              <p className="text-lg font-semibold text-zinc-900">{lastLog.clientsUpdated}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Services Upserted</p>
              <p className="text-lg font-semibold text-zinc-900">{lastLog.servicesUpserted}</p>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-600">Warnings</p>
              <ul className="flex flex-col gap-1 text-sm text-zinc-700">
                {warnings.map((w, i) => (
                  <li key={i} className="rounded-md bg-zinc-50 px-3 py-2">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
