import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalApplyLeave, portalCancelLeave } from "@/app/actions/hrm-portal";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-zinc-100 text-zinc-500",
};

export default async function PortalLeavesPage() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const [leaveTypes, leaves, balances] = await Promise.all([
    prisma.hRMLeaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMLeave.findMany({
      where: { employeeId: empId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hRMLeaveBalance.findMany({
      where: { employeeId: empId, year: new Date().getFullYear() },
      include: { leaveType: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">My Leaves</h1>

      {/* Leave balances */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {balances.map((b) => {
            const pct = b.allocated > 0 ? Math.max(0, Math.min(100, (b.remaining / b.allocated) * 100)) : 0;
            return (
              <div key={b.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs text-zinc-500 mb-1">{b.leaveType.name}</p>
                <p className="text-2xl font-bold text-zinc-900">{b.remaining}</p>
                <p className="text-xs text-zinc-400 mb-2">of {b.allocated} days remaining</p>
                <div className="h-1.5 w-full rounded-full bg-zinc-100">
                  <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply for leave */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">
          Apply for Leave
        </h2>
        <form action={portalApplyLeave} className="space-y-4 max-w-xl">
          {/* Leave type */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Leave Type <span className="text-red-500">*</span></label>
            <select
              name="leaveTypeId"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-white"
            >
              <option value="">— Select leave type —</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}{lt.isPaid ? " (Paid)" : " (Unpaid)"} · {lt.daysAllowed} days/year
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">End Date <span className="text-red-500">*</span></label>
              <input
                name="endDate"
                type="date"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Reason <span className="text-zinc-400">(optional)</span></label>
            <textarea
              name="reason"
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
              placeholder="Briefly describe the reason for your leave..."
            />
          </div>

          <button
            type="submit"
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
          >
            Submit Application
          </button>
        </form>
      </div>

      {/* Leave history */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Leave History</h2>
          <span className="text-xs text-zinc-400">{leaves.length} record{leaves.length !== 1 ? "s" : ""}</span>
        </div>
        {leaves.length === 0 ? (
          <div className="px-5 py-10 text-center text-zinc-400 text-sm">No leave applications yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Applied</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{l.leaveType.name}</p>
                    <span className={`text-[10px] font-medium ${l.leaveType.isPaid ? "text-green-600" : "text-zinc-400"}`}>
                      {l.leaveType.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-xs">
                    {l.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {" → "}
                    {l.endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{l.days}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-[140px] truncate">{l.reason ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[l.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {l.status}
                    </span>
                    {l.status === "REJECTED" && (l as any).rejectedReason && (
                      <p className="text-[10px] text-red-400 mt-0.5">{(l as any).rejectedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {l.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    {l.status === "PENDING" && (
                      <form action={portalCancelLeave.bind(null, l.id)}>
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">
                          Cancel
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
