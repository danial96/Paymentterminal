import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PortalDashboard() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [employee, attendance, leaves, notices, payslipRequests] = await Promise.all([
    prisma.hRMEmployee.findUnique({
      where: { id: empId },
      include: { department: true, designation: true },
    }),
    prisma.hRMAttendance.findMany({ where: { employeeId: empId, date: { gte: monthStart } } }),
    prisma.hRMLeaveBalance.findMany({
      where: { employeeId: empId, year: now.getFullYear() },
      include: { leaveType: true },
    }),
    prisma.hRMNotice.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.hRMPayslipRequest.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const presentCount = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendance.filter((a) => a.status === "LATE").length;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Welcome, {employee?.firstName}!</h1>
        <p className="text-sm text-zinc-500">
          {employee?.designation?.name}
          {employee?.department?.name ? ` · ${employee.department.name}` : ""}
        </p>
      </div>

      {/* This month stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Present This Month", value: presentCount },
          { label: "Absent", value: absentCount },
          { label: "Late", value: lateCount },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Leave balances */}
      {leaves.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Leave Balance {now.getFullYear()}</h2>
          <div className="space-y-2">
            {leaves.map((lb) => (
              <div key={lb.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{lb.leaveType.name}</span>
                <span className="font-medium text-zinc-900">
                  {lb.remaining} / {lb.allocated} days remaining
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent payslip requests */}
      {payslipRequests.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Payslip Requests</h2>
          <div className="space-y-2">
            {payslipRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">
                  {MONTHS[req.month - 1]} {req.year}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    req.status === "FULFILLED"
                      ? "bg-zinc-900 text-white"
                      : req.status === "REJECTED"
                      ? "bg-zinc-200 text-zinc-600"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notices */}
      {notices.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Latest Notices</h2>
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="text-sm">
                <p className="font-medium text-zinc-900">{n.title}</p>
                <p className="text-xs text-zinc-400">
                  {n.publishedAt?.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
