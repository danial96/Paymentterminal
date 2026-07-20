import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { applyLeave } from "@/app/actions/hrm-leaves";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-zinc-200 text-zinc-600",
  APPROVED: "bg-zinc-900 text-white",
  REJECTED: "bg-zinc-200 text-zinc-600",
  CANCELLED: "bg-zinc-100 text-zinc-500",
};

export default async function ESSLeavesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const employee = await prisma.hRMEmployee.findFirst({
    where: { userId: Number(session.user.id), deletedAt: null },
  });

  if (!employee) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-400">
        No employee record linked to your account. Contact HR.
      </div>
    );
  }

  const [leaves, leaveTypes, balances] = await Promise.all([
    prisma.hRMLeave.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: "desc" },
      include: { leaveType: true },
    }),
    prisma.hRMLeaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMLeaveBalance.findMany({
      where: { employeeId: employee.id, year: new Date().getFullYear() },
      include: { leaveType: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">My Leaves</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Apply Leave Form */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Apply for Leave</h2>
          <form action={applyLeave} className="space-y-3">
            <input type="hidden" name="employeeId" value={employee.id} />
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Leave Type *</label>
              <select name="leaveTypeId" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select</option>
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">From *</label>
                <input name="startDate" type="date" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">To *</label>
                <input name="endDate" type="date" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Reason *</label>
              <textarea name="reason" required rows={3} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <button type="submit" className="btn-brand w-full rounded-lg py-2 text-sm font-medium text-white">Submit Request</button>
          </form>

          {/* Leave Balances */}
          {balances.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <p className="text-xs font-semibold text-zinc-700 mb-2">Leave Balances ({new Date().getFullYear()})</p>
              <div className="space-y-1.5">
                {balances.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600">{b.leaveType.name}</span>
                    <span className="font-semibold text-zinc-900">{b.remaining}/{b.allocated} days</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Leave History */}
        <div className="col-span-2 space-y-3">
          {leaves.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-400">No leave requests yet</div>
          ) : (
            leaves.map((l) => (
              <div key={l.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{l.leaveType.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {l.startDate.toLocaleDateString("en-GB")} – {l.endDate.toLocaleDateString("en-GB")}
                      {" "}· {l.days} day{l.days !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                </div>
                {l.reason && <p className="mt-2 text-xs text-zinc-500">{l.reason}</p>}
                {l.rejectedReason && (
                  <p className="mt-1 text-xs text-zinc-700 bg-zinc-100 rounded px-2 py-1">Reason: {l.rejectedReason}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
