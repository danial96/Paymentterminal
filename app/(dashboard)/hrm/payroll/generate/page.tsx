import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { generatePayroll } from "@/app/actions/hrm-payroll";
import Link from "next/link";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function GeneratePayrollPage({ searchParams }: { searchParams: Promise<{ emp?: string }> }) {
  await requireUser();
  const now = new Date();
  const { emp } = await searchParams;
  const preselectedEmpId = emp ? Number(emp) : null;
  const employees = await prisma.hRMEmployee.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    include: { department: true, designation: true, allowances: { where: { isActive: true } }, deductions: { where: { isActive: true } } },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/hrm/payroll" className="text-zinc-400 hover:text-zinc-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-zinc-900">Generate Payroll</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
        <form action={generatePayroll} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Employee *</label>
              <select name="employeeId" required defaultValue={preselectedEmpId ?? ""} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} {e.basicSalary ? `(${Number(e.basicSalary).toLocaleString()})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Month *</label>
              <select name="month" defaultValue={now.getMonth() + 1} required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Year *</label>
              <select name="year" defaultValue={now.getFullYear()} required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {[now.getFullYear(), now.getFullYear() - 1].map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <hr className="border-zinc-100" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Earnings (Additional)</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Bonuses</label>
              <input name="bonuses" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Overtime Pay</label>
              <input name="overtimePay" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Commission</label>
              <input name="commission" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <hr className="border-zinc-100" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Deductions (Additional)</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Tax</label>
              <input name="taxDeduction" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Provident Fund</label>
              <input name="pfDeduction" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">EOBI</label>
              <input name="eobiDeduction" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Loan Deduction</label>
              <input name="loanDeduction" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Advance Deduction</label>
              <input name="advanceDeduction" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Other Deductions</label>
              <input name="otherDeductions" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Notes</label>
            <textarea name="notes" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <p className="text-xs text-zinc-400 bg-zinc-50 rounded-lg p-3">
            <strong>Note:</strong> Late and absent deductions are calculated automatically from attendance records. Employee allowances and recurring deductions are also applied automatically.
          </p>

          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">Generate Payslip</button>
            <Link href="/hrm/payroll" className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
