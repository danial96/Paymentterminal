import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { approveLeave, rejectLeaveWithReason, applyLeave, addLeaveManually } from "@/app/actions/hrm-leaves";
import { SubmitButton } from "@/app/components/SubmitButton";
import { FilterForm } from "@/app/components/FilterForm";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-zinc-200 text-zinc-700",
  APPROVED: "bg-zinc-900 text-white",
  REJECTED: "bg-zinc-200 text-zinc-600",
  CANCELLED: "bg-zinc-100 text-zinc-500",
};

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; emp?: string }>;
}) {
  const user = await requireUser();
  const { status, emp } = await searchParams;

  const [leaves, employees, leaveTypes] = await Promise.all([
    prisma.hRMLeave.findMany({
      where: {
        ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" } : {}),
        ...(emp ? { employeeId: Number(emp) } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { employee: { include: { department: true } }, leaveType: true },
    }),
    prisma.hRMEmployee.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { firstName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
    prisma.hRMLeaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const pending = leaves.filter((l) => l.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Leave Management</h1>
          <p className="text-sm text-zinc-500">{pending.length} pending request{pending.length !== 1 ? "s" : ""}</p>
        </div>
        <a href="/hrm/leaves/types" className="text-sm text-zinc-700 hover:underline">Manage Leave Types →</a>
      </div>

      {/* Leave Forms */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Apply on behalf — goes to PENDING */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Apply on Behalf</h2>
            <span className="rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[10px] font-semibold">PENDING</span>
          </div>
          <form action={applyLeave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select name="employeeId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select Employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              <select name="leaveTypeId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Leave Type</option>
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="startDate" type="date" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              <input name="endDate" type="date" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <input name="reason" placeholder="Reason (optional)" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            <SubmitButton className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white w-full" pendingText="Submitting...">Submit for Approval</SubmitButton>
          </form>
        </div>

        {/* Manual add — direct APPROVED */}
        <div className="rounded-xl border border-emerald-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Add Leave Manually</h2>
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">AUTO APPROVED</span>
          </div>
          <form action={addLeaveManually} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select name="employeeId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select Employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              <select name="leaveTypeId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Leave Type</option>
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="startDate" type="date" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              <input name="endDate" type="date" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <input name="reason" placeholder="Reason / Note (optional)" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            <SubmitButton className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" pendingText="Adding...">Add & Approve Directly</SubmitButton>
          </form>
        </div>
      </div>

      {/* Filters */}
      <FilterForm action="/hrm/leaves" className="flex gap-2 items-center">
        <select name="status" defaultValue={status} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select name="emp" defaultValue={emp} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
          <option value="">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
        <button type="submit" className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white">Filter</button>
        <a href="/hrm/leaves" className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Clear</a>
      </FilterForm>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Leave Type</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">To</th>
              <th className="px-4 py-3 text-left">Days</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {leaves.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-400">No leave requests found</td></tr>
            )}
            {leaves.map((leave) => (
              <tr key={leave.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{leave.employee.firstName} {leave.employee.lastName}</p>
                  <p className="text-xs text-zinc-400">{leave.employee.department?.name ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {leave.leaveType.name}
                  <span className={`ml-1 text-[10px] rounded-full px-1.5 py-0.5 ${leave.leaveType.isPaid ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                    {leave.leaveType.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{leave.startDate.toLocaleDateString("en-GB")}</td>
                <td className="px-4 py-3 text-xs">{leave.endDate.toLocaleDateString("en-GB")}</td>
                <td className="px-4 py-3 text-xs font-medium">{leave.days}</td>
                <td className="px-4 py-3 text-xs text-zinc-500 max-w-32 truncate">{leave.reason || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[leave.status] ?? "bg-zinc-100"}`}>
                    {leave.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {leave.status === "PENDING" && (
                    <div className="flex flex-col gap-1.5">
                      <form action={approveLeave.bind(null, leave.id, Number(user.id))}>
                        <SubmitButton className="text-xs text-zinc-700 hover:text-zinc-800 font-medium" pendingText="Approving...">Approve</SubmitButton>
                      </form>
                      <form action={rejectLeaveWithReason} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={leave.id} />
                        <input
                          name="reason"
                          placeholder="Reason (optional)"
                          className="w-28 rounded border border-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                        />
                        <SubmitButton className="text-xs text-red-500 hover:text-red-700 font-medium" pendingText="Rejecting...">Reject</SubmitButton>
                      </form>
                    </div>
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
