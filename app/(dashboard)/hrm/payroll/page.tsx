import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { approvePayroll, markPayrollPaid } from "@/app/actions/hrm-payroll";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-500",
  APPROVED: "bg-blue-100 text-blue-600",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-500",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; emp?: string }>;
}) {
  await requireUser();
  const now = new Date();
  const { month, year, emp } = await searchParams;
  const filterMonth = month ? Number(month) : now.getMonth() + 1;
  const filterYear = year ? Number(year) : now.getFullYear();

  const payrolls = await prisma.hRMPayroll.findMany({
    where: {
      month: filterMonth,
      year: filterYear,
      ...(emp ? { employeeId: Number(emp) } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { employee: { include: { department: true, designation: true } } },
  });

  const employees = await prisma.hRMEmployee.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });

  const totalGross = payrolls.reduce((sum, p) => sum + Number(p.grossSalary), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + Number(p.totalDeductions), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Payroll</h1>
          <p className="text-sm text-zinc-500">{MONTHS[filterMonth - 1]} {filterYear}</p>
        </div>
        <Link href="/hrm/payroll/generate" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Generate Payroll</Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-400">Total Gross</p>
          <p className="text-2xl font-bold text-zinc-900 mt-0.5">{totalGross.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-400">Total Deductions</p>
          <p className="text-2xl font-bold text-red-600 mt-0.5">{totalDeductions.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-400">Net Payable</p>
          <p className="text-2xl font-bold text-emerald-600 mt-0.5">{totalNet.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-2">
        <select name="month" defaultValue={filterMonth} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select name="year" defaultValue={filterYear} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => <option key={y}>{y}</option>)}
        </select>
        <select name="emp" defaultValue={emp} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Filter</button>
      </form>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-right">Basic</th>
              <th className="px-4 py-3 text-right">Allowances</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">Deductions</th>
              <th className="px-4 py-3 text-right">Net Salary</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {payrolls.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-400">
                  No payroll generated for this month.
                  <Link href="/hrm/payroll/generate" className="block mt-2 text-indigo-600 hover:underline text-sm">Generate payroll →</Link>
                </td>
              </tr>
            )}
            {payrolls.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{p.employee.firstName} {p.employee.lastName}</p>
                  <p className="text-xs text-zinc-400">{p.employee.designation?.name ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-right text-sm">{Number(p.basicSalary).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm text-emerald-600">+{Number(p.allowances).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm font-medium">{Number(p.grossSalary).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm text-red-500">-{Number(p.totalDeductions).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-zinc-900">{Number(p.netSalary).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[p.status] ?? "bg-zinc-100"}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/hrm/payroll/${p.id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                    {p.status === "DRAFT" && (
                      <form action={approvePayroll.bind(null, p.id)}>
                        <button type="submit" className="text-xs text-blue-600 hover:text-blue-800 font-medium">Approve</button>
                      </form>
                    )}
                    {p.status === "APPROVED" && (
                      <form action={markPayrollPaid.bind(null, p.id)}>
                        <button type="submit" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Mark Paid</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
