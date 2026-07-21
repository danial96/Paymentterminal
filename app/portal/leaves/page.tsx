import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalApplyLeave, portalCancelLeave } from "@/app/actions/hrm-portal";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-zinc-100 text-zinc-500",
};

const LEAVE_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-600", bar: "#3b82f6", icon: "🏖️" },
  { bg: "bg-green-50", text: "text-green-600", bar: "#22c55e", icon: "🤒" },
  { bg: "bg-purple-50", text: "text-purple-600", bar: "#a855f7", icon: "👶" },
  { bg: "bg-orange-50", text: "text-orange-600", bar: "#f97316", icon: "⚡" },
  { bg: "bg-pink-50", text: "text-pink-600", bar: "#ec4899", icon: "📅" },
  { bg: "bg-teal-50", text: "text-teal-600", bar: "#14b8a6", icon: "🌿" },
];

export default async function PortalLeavesPage() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);
  const year = new Date().getFullYear();

  const [leaveTypes, leaves, balances] = await Promise.all([
    prisma.hRMLeaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMLeave.findMany({
      where: { employeeId: empId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hRMLeaveBalance.findMany({
      where: { employeeId: empId, year },
      include: { leaveType: true },
    }),
  ]);

  // Build balance display: prefer DB balance, fallback to leaveType.daysAllowed minus approved leaves
  const balanceMap = new Map(balances.map((b) => [b.leaveTypeId, b]));
  const approvedByType = new Map<number, number>();
  for (const l of leaves) {
    if (l.status === "APPROVED" && new Date(l.startDate).getFullYear() === year) {
      approvedByType.set(l.leaveTypeId, (approvedByType.get(l.leaveTypeId) ?? 0) + l.days);
    }
  }

  const leaveCards = leaveTypes.map((lt, i) => {
    const bal = balanceMap.get(lt.id);
    const allocated = bal?.allocated ?? lt.daysAllowed;
    const used = bal ? (allocated - bal.remaining) : (approvedByType.get(lt.id) ?? 0);
    const remaining = bal ? bal.remaining : Math.max(0, allocated - used);
    const pct = allocated > 0 ? Math.round((remaining / allocated) * 100) : 0;
    const color = LEAVE_COLORS[i % LEAVE_COLORS.length];
    return { lt, allocated, used, remaining, pct, color };
  });

  const pendingDays = leaves.filter((l) => l.status === "PENDING").reduce((s, l) => s + l.days, 0);
  const usedThisYear = leaves.filter((l) => l.status === "APPROVED" && new Date(l.startDate).getFullYear() === year).reduce((s, l) => s + l.days, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold text-zinc-900">My Leaves</h1>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{usedThisYear}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Days Used ({year})</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingDays}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Days Pending</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{leaveCards.reduce((s, c) => s + c.remaining, 0)}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Total Remaining</p>
        </div>
      </div>

      {/* Leave balance cards */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">Leave Balance — {year}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {leaveCards.map(({ lt, allocated, used, remaining, pct, color }) => (
            <div key={lt.id} className={`rounded-xl border border-zinc-200 bg-white p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-lg rounded-lg p-1.5 ${color.bg}`}>{color.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 truncate">{lt.name}</p>
                  <p className={`text-[10px] font-medium ${lt.isPaid ? "text-emerald-600" : "text-zinc-400"}`}>{lt.isPaid ? "Paid" : "Unpaid"}</p>
                </div>
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className={`text-2xl font-bold ${color.text}`}>{remaining}</p>
                  <p className="text-[10px] text-zinc-400">of {allocated} days</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-500">{used} used</p>
                  <p className="text-[10px] text-zinc-400">{pct}% left</p>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-100">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color.bar }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply for leave */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">Apply for Leave</h2>
        <form action={portalApplyLeave} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Leave Type <span className="text-red-500">*</span></label>
            <select name="leaveTypeId" required className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-white">
              <option value="">— Select leave type —</option>
              {leaveCards.map(({ lt, remaining }) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} · {remaining} days remaining
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
              <input name="startDate" type="date" required className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">End Date <span className="text-red-500">*</span></label>
              <input name="endDate" type="date" required className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Reason <span className="text-zinc-400">(optional)</span></label>
            <textarea name="reason" rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none" placeholder="Briefly describe the reason..." />
          </div>
          <button type="submit" className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}>
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
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">Cancel</button>
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
