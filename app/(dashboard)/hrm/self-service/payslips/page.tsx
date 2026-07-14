import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-500",
  APPROVED: "bg-blue-100 text-blue-600",
  PAID: "bg-emerald-100 text-emerald-700",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function ESSPayslipsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const employee = await prisma.hRMEmployee.findFirst({
    where: { userId: Number(session.user.id), deletedAt: null },
    include: { designation: true, department: true },
  });

  if (!employee) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-400">
        No employee record linked to your account. Contact HR.
      </div>
    );
  }

  const payrolls = await prisma.hRMPayroll.findMany({
    where: { employeeId: employee.id },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { items: true },
  });

  const ytdPaid = payrolls
    .filter((p) => p.status === "PAID" && p.year === new Date().getFullYear())
    .reduce((sum, p) => sum + Number(p.netSalary), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">My Payslips</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{employee.firstName} {employee.lastName} · {employee.employeeId}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">YTD Net Paid ({new Date().getFullYear()})</p>
          <p className="text-lg font-bold text-emerald-600">{ytdPaid.toLocaleString()}</p>
        </div>
      </div>

      {payrolls.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-400">No payslips generated yet</div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-right">Basic Salary</th>
                <th className="px-4 py-3 text-right">Allowances</th>
                <th className="px-4 py-3 text-right">Deductions</th>
                <th className="px-4 py-3 text-right">Net Salary</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {payrolls.map((p) => {
                const allowances = p.items.filter((i) => ["allowance","bonus","overtime","commission"].includes(i.type)).reduce((s, i) => s + Number(i.amount), 0);
                const deductions = p.items.filter((i) => i.type === "deduction").reduce((s, i) => s + Number(i.amount), 0);
                return (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {MONTHS[p.month - 1]} {p.year}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600">{Number(p.basicSalary).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">+{allowances.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-500">-{Number(p.totalDeductions).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900">{Number(p.netSalary).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/hrm/payroll/${p.id}`} className="text-xs text-indigo-600 hover:underline">View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Salary Breakdown (latest payslip) */}
      {payrolls[0] && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">
            Latest Payslip — {MONTHS[payrolls[0].month - 1]} {payrolls[0].year}
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">Earnings</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Basic Salary</span>
                  <span className="font-medium text-zinc-900">{Number(payrolls[0].basicSalary).toLocaleString()}</span>
                </div>
                {payrolls[0].items.filter((i) => ["allowance","bonus","overtime","commission"].includes(i.type)).map((i) => (
                  <div key={i.id} className="flex justify-between text-xs">
                    <span className="text-zinc-600">{i.label}</span>
                    <span className="font-medium text-emerald-600">{Number(i.amount).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-zinc-100 pt-1.5 flex justify-between text-xs font-semibold">
                  <span>Gross Salary</span>
                  <span>{Number(payrolls[0].grossSalary).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">Deductions</p>
              <div className="space-y-1.5">
                {payrolls[0].items.filter((i) => i.type === "deduction").map((i) => (
                  <div key={i.id} className="flex justify-between text-xs">
                    <span className="text-zinc-600">{i.label}</span>
                    <span className="font-medium text-red-500">-{Number(i.amount).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-zinc-100 pt-1.5 flex justify-between text-xs font-semibold">
                  <span>Total Deductions</span>
                  <span className="text-red-500">-{Number(payrolls[0].totalDeductions).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-indigo-900">Net Salary</span>
            <span className="text-xl font-bold text-indigo-700">{Number(payrolls[0].netSalary).toLocaleString()}</span>
          </div>
          <div className="mt-3 text-right">
            <Link href={`/hrm/payroll/${payrolls[0].id}`} className="text-xs text-indigo-600 hover:underline">View full payslip / Print →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
