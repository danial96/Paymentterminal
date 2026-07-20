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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {balances.map((b) => (
            <div key={b.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500 mb-1">{b.leaveType.name}</p>
              <p className="text-2xl font-bold text-zinc-900">{b.remaining}</p>
              <p className="text-xs text-zinc-400">of {b.allocated} days remaining</p>
            </div>
          ))}
        </div>
      )}

      {/* Apply for leave */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">
          Apply for Leave
        </h2>
        <form action={portalApplyLeave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Leave Type *</label>
              <select
                name="leaveTypeId"
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="">Select type</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name}
                  </option>
                ))}
              </select>
            </div>
            <div />
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Start Date *</label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">End Date *</label>
              <input
                name="endDate"
                type="date"
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Reason</label>
              <textarea
                name="reason"
                rows={2}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                placeholder="Optional reason..."
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg px-6 py-2 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
          >
            Submit Application
          </button>
        </form>
      </div>

      {/* Leave history */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Leave History</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">From</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">To</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Days</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Reason</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {leaves.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  No leave records yet.
                </td>
              </tr>
            )}
            {leaves.map((l) => (
              <tr key={l.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-900">{l.leaveType.name}</td>
                <td className="px-4 py-3 text-zinc-700">{l.startDate.toLocaleDateString()}</td>
                <td className="px-4 py-3 text-zinc-700">{l.endDate.toLocaleDateString()}</td>
                <td className="px-4 py-3 text-zinc-700">{l.days}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[l.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{l.reason ?? "—"}</td>
                <td className="px-4 py-3">
                  {l.status === "PENDING" && (
                    <form action={portalCancelLeave.bind(null, l.id)}>
                      <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium">
                        Cancel
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
