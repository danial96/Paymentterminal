import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; dept?: string }>;
}) {
  await requireUser();
  const now = new Date();
  const { month, year, dept } = await searchParams;
  const filterMonth = month ? Number(month) : now.getMonth() + 1;
  const filterYear = year ? Number(year) : now.getFullYear();

  const startDate = new Date(filterYear, filterMonth - 1, 1);
  const endDate = new Date(filterYear, filterMonth, 1);

  const [
    totalEmployees, activeEmployees, newHires, resignations,
    departments, deptStats, attendanceSummary, leaveSummary, payrollSummary,
  ] = await Promise.all([
    prisma.hRMEmployee.count({ where: { deletedAt: null } }),
    prisma.hRMEmployee.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.hRMEmployee.count({ where: { deletedAt: null, joiningDate: { gte: startDate, lt: endDate } } }),
    prisma.hRMEmployee.count({ where: { deletedAt: null, status: "RESIGNED", resignedDate: { gte: startDate, lt: endDate } } }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, include: { _count: { select: { employees: true } } }, orderBy: { name: "asc" } }),
    prisma.hRMEmployee.groupBy({ by: ["departmentId"], _count: { id: true }, where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.hRMAttendance.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { date: { gte: startDate, lt: endDate }, ...(dept ? { employee: { departmentId: Number(dept) } } : {}) },
    }),
    prisma.hRMLeave.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { createdAt: { gte: startDate, lt: endDate } },
    }),
    prisma.hRMPayroll.aggregate({
      where: { month: filterMonth, year: filterYear },
      _sum: { grossSalary: true, netSalary: true, totalDeductions: true },
      _count: { id: true },
    }),
  ]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const attMap = Object.fromEntries(attendanceSummary.map((a) => [a.status, a._count.id]));
  const leaveMap = Object.fromEntries(leaveSummary.map((l) => [l.status, l._count.id]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Reports & Analytics</h1>
        <form method="GET" className="flex gap-2">
          <select name="month" defaultValue={filterMonth} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select name="year" defaultValue={filterYear} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => <option key={y}>{y}</option>)}
          </select>
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Apply</button>
        </form>
      </div>

      <p className="text-sm text-zinc-500 -mt-2">Showing data for {MONTHS[filterMonth - 1]} {filterYear}</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: totalEmployees, sub: `${activeEmployees} active`, color: "indigo" },
          { label: "New Hires", value: newHires, sub: "this month", color: "emerald" },
          { label: "Resignations", value: resignations, sub: "this month", color: "red" },
          { label: "Departments", value: departments.length, sub: "active", color: "purple" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
            <p className="text-xs font-medium text-zinc-700 mt-0.5">{label}</p>
            <p className="text-[10px] text-zinc-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Attendance Report */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Attendance Summary</h2>
          <div className="space-y-2">
            {[
              { label: "Present", key: "PRESENT", color: "emerald" },
              { label: "Late", key: "LATE", color: "orange" },
              { label: "Absent", key: "ABSENT", color: "red" },
              { label: "Half Day", key: "HALF_DAY", color: "amber" },
              { label: "On Leave", key: "ON_LEAVE", color: "blue" },
              { label: "Holiday", key: "HOLIDAY", color: "purple" },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">{label}</span>
                <span className={`text-sm font-semibold text-${color}-600`}>{attMap[key] ?? 0}</span>
              </div>
            ))}
            <div className="border-t border-zinc-100 pt-2 flex justify-between">
              <span className="text-xs font-medium text-zinc-700">Total Records</span>
              <span className="text-sm font-bold text-zinc-900">{Object.values(attMap).reduce((a, b) => a + b, 0)}</span>
            </div>
          </div>
          <Link href={`/hrm/attendance?date=${new Date(filterYear, filterMonth - 1, 1).toISOString().split("T")[0]}`} className="block mt-4 text-xs text-indigo-600 hover:underline">View Attendance →</Link>
        </div>

        {/* Leave Report */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Leave Summary</h2>
          <div className="space-y-2">
            {[
              { label: "Pending", key: "PENDING", color: "amber" },
              { label: "Approved", key: "APPROVED", color: "emerald" },
              { label: "Rejected", key: "REJECTED", color: "red" },
              { label: "Cancelled", key: "CANCELLED", color: "zinc" },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">{label}</span>
                <span className={`text-sm font-semibold text-${color}-600`}>{leaveMap[key] ?? 0}</span>
              </div>
            ))}
            <div className="border-t border-zinc-100 pt-2 flex justify-between">
              <span className="text-xs font-medium text-zinc-700">Total Requests</span>
              <span className="text-sm font-bold text-zinc-900">{Object.values(leaveMap).reduce((a, b) => a + b, 0)}</span>
            </div>
          </div>
          <Link href="/hrm/leaves" className="block mt-4 text-xs text-indigo-600 hover:underline">View Leaves →</Link>
        </div>

        {/* Payroll Report */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Payroll Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-zinc-600">Payslips Generated</span>
              <span className="text-sm font-semibold text-zinc-900">{payrollSummary._count.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-zinc-600">Total Gross</span>
              <span className="text-sm font-semibold text-zinc-900">{Number(payrollSummary._sum.grossSalary ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-zinc-600">Total Deductions</span>
              <span className="text-sm font-semibold text-red-500">-{Number(payrollSummary._sum.totalDeductions ?? 0).toLocaleString()}</span>
            </div>
            <div className="border-t border-zinc-100 pt-2 flex justify-between">
              <span className="text-xs font-medium text-zinc-700">Net Payable</span>
              <span className="text-sm font-bold text-emerald-600">{Number(payrollSummary._sum.netSalary ?? 0).toLocaleString()}</span>
            </div>
          </div>
          <Link href="/hrm/payroll" className="block mt-4 text-xs text-indigo-600 hover:underline">View Payroll →</Link>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Department Breakdown</h2>
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
          {departments.map((d) => (
            <Link key={d.id} href={`/hrm/employees?dept=${d.id}`} className="rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition-colors text-center">
              <p className="text-2xl font-bold text-indigo-600">{d._count.employees}</p>
              <p className="text-xs text-zinc-600 mt-1 truncate">{d.name}</p>
              {d.code && <p className="text-[10px] text-zinc-400 font-mono">{d.code}</p>}
            </Link>
          ))}
          {departments.length === 0 && (
            <p className="col-span-5 text-center text-sm text-zinc-400 py-4">No departments yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
