import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { updateComplaintStatus } from "@/app/actions/zkteco";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  DISMISSED: "bg-zinc-100 text-zinc-500",
};

const STATUSES = ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"];

export default async function ComplaintsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser();
  const { status } = await searchParams;

  const complaints = await (prisma as any).hRMComplaint.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Complaints</h1>
          <p className="text-sm text-zinc-500">{complaints.length} complaint{complaints.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filter */}
      <form method="GET" className="flex gap-2">
        <select name="status" defaultValue={status} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <button type="submit" className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white">Filter</button>
        {status && <a href="/hrm/complaints" className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Clear</a>}
      </form>

      <div className="space-y-3">
        {complaints.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center text-zinc-400 text-sm">No complaints found</div>
        )}
        {complaints.map((c: any) => (
          <div key={c.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_STYLES[c.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {c.status.replace("_", " ")}
                  </span>
                  {c.category && <span className="text-[10px] text-zinc-400 bg-zinc-100 rounded px-1.5 py-0.5">{c.category}</span>}
                  <span className="text-xs text-zinc-400">{new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{c.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{c.employee.firstName} {c.employee.lastName} · {c.employee.employeeId}</p>
                <p className="text-sm text-zinc-600 mt-2 whitespace-pre-wrap">{c.description}</p>
                {c.hrNote && (
                  <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-blue-600 mb-0.5">HR Note</p>
                    <p className="text-xs text-blue-800">{c.hrNote}</p>
                  </div>
                )}
              </div>
              <form action={updateComplaintStatus} className="flex flex-col gap-2 shrink-0 min-w-[180px]">
                <input type="hidden" name="id" value={c.id} />
                <select name="status" defaultValue={c.status} className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                <textarea name="hrNote" defaultValue={c.hrNote ?? ""} rows={2} placeholder="HR response (optional)" className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400" />
                <button type="submit" className="rounded-md px-3 py-1.5 text-xs font-medium text-white btn-brand">Update</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
