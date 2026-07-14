import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { approveLeave, rejectLeave, applyLeave } from "@/app/actions/hrm-leaves";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
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
        <a href="/hrm/leaves/types" className="text-sm text-indigo-600 hover:underline">Manage Leave Types →</a>
      </div>

      {/* Apply Leave Form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Apply Leave (on behalf)</h2>
        <form action={applyLeave} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <select name="employeeId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select Employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
          <select name="leaveTypeId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Leave Type</option>
            {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
          </select>
          <input name="startDate" type="date" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input name="endDate" type="date" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Apply</button>
        </form>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-2">
        <select name="status" defaultValue={status} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select name="emp" defaultValue={emp} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Filter</button>
        <a href="/hrm/leaves" className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Clear</a>
      </form>

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
                  <span className={`ml-1 text-[10px] rounded-full px-1.5 py-0.5 ${leave.leaveType.isPaid ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}>
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
                    <div className="flex gap-2">
                      <form action={approveLeave.bind(null, leave.id, Number(user.id))}>
                        <button type="submit" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Approve</button>
                      </form>
                      <form action={rejectLeave.bind(null, leave.id, "Rejected by HR")}>
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium">Reject</button>
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
