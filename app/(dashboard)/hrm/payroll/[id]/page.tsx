import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { approvePayroll, markPayrollPaid, deletePayroll } from "@/app/actions/hrm-payroll";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     "bg-zinc-100 text-zinc-600",
  APPROVED:  "bg-blue-100 text-blue-700",
  PAID:      "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-zinc-200 text-zinc-500",
};

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const payroll = await prisma.hRMPayroll.findUnique({
    where: { id: Number(id) },
    include: {
      employee: { include: { department: true, designation: true } },
      items: { orderBy: { id: "asc" } },
    },
  });
  if (!payroll) notFound();

  const monthStart = new Date(payroll.year, payroll.month - 1, 1);
  const monthEnd   = new Date(payroll.year, payroll.month, 0);
  const attendance = await prisma.hRMAttendance.findMany({
    where: { employeeId: payroll.employeeId, date: { gte: monthStart, lte: monthEnd } },
  });
  const presentDays = attendance.filter(a => ["PRESENT","LATE"].includes(a.status)).length;
  const lateDays    = attendance.filter(a => a.status === "LATE").length;
  const absentDays  = attendance.filter(a => a.status === "ABSENT").length;

  const earnings   = payroll.items.filter(i => ["allowance","bonus","overtime","commission"].includes(i.type));
  const deductions = payroll.items.filter(i => i.type === "deduction");

  const emp = payroll.employee;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/hrm/payroll" className="text-zinc-400 hover:text-zinc-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              {emp.firstName} {emp.lastName} — {MONTHS[payroll.month - 1]} {payroll.year}
            </h1>
            <p className="text-sm text-zinc-400">{emp.designation?.name ?? "—"} · {emp.department?.name ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[payroll.status] ?? "bg-zinc-100 text-zinc-500"}`}>
            {payroll.status}
          </span>
          <a href={`/hrm/payroll/${payroll.id}/pdf?logo=1`} target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            PDF / Print
          </a>
          {payroll.status === "DRAFT" && (
            <form action={approvePayroll.bind(null, payroll.id)}>
              <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Approve</button>
            </form>
          )}
          {payroll.status === "APPROVED" && (
            <form action={markPayrollPaid.bind(null, payroll.id)}>
              <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Mark Paid</button>
            </form>
          )}
          {payroll.status === "DRAFT" && (
            <form action={deletePayroll.bind(null, payroll.id)}>
              <button type="submit" className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
            </form>
          )}
        </div>
      </div>

      {/* Employee & Attendance Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Employee</p>
          <Row label="Employee ID" value={emp.employeeId} />
          <Row label="Department"  value={emp.department?.name} />
          <Row label="Designation" value={emp.designation?.name} />
          <Row label="Type"        value={emp.employmentType?.replace(/_/g," ")} />
          {payroll.notes && <Row label="Notes" value={payroll.notes} />}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Attendance — {MONTHS[payroll.month-1]} {payroll.year}</p>
          <Row label="Present Days" value={String(presentDays)} />
          <Row label="Late Days"    value={String(lateDays)} />
          <Row label="Absent Days"  value={String(absentDays)} />
          <Row label="Generated"    value={payroll.generatedAt ? new Date(payroll.generatedAt).toLocaleDateString("en-GB") : "—"} />
          {payroll.paidAt && <Row label="Paid On" value={new Date(payroll.paidAt).toLocaleDateString("en-GB")} />}
        </div>
      </div>

      {/* Earnings */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Earnings</p>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-100">
            <tr className="hover:bg-zinc-50">
              <td className="px-5 py-2.5 text-zinc-700">Basic Salary</td>
              <td className="px-5 py-2.5 text-right font-semibold text-zinc-900">{Number(payroll.basicSalary).toLocaleString()}</td>
            </tr>
            {earnings.map(e => (
              <tr key={e.id} className="hover:bg-zinc-50">
                <td className="px-5 py-2.5 text-zinc-600">{e.label}</td>
                <td className="px-5 py-2.5 text-right text-emerald-700 font-medium">+{Number(e.amount).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-zinc-50 font-semibold">
              <td className="px-5 py-2.5 text-zinc-900">Gross Salary</td>
              <td className="px-5 py-2.5 text-right text-zinc-900">{Number(payroll.grossSalary).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Deductions</p>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-100">
            {deductions.length === 0 ? (
              <tr><td colSpan={2} className="px-5 py-4 text-center text-zinc-400">No deductions</td></tr>
            ) : deductions.map(d => (
              <tr key={d.id} className="hover:bg-zinc-50">
                <td className="px-5 py-2.5 text-zinc-600">{d.label}</td>
                <td className="px-5 py-2.5 text-right text-red-600 font-medium">-{Number(d.amount).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-zinc-50 font-semibold">
              <td className="px-5 py-2.5 text-zinc-900">Total Deductions</td>
              <td className="px-5 py-2.5 text-right text-red-600">-{Number(payroll.totalDeductions).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Salary */}
      <div className="rounded-xl border-2 border-zinc-900 bg-zinc-900 px-6 py-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-300">Net Salary</p>
        <p className="text-2xl font-bold text-white">{Number(payroll.netSalary).toLocaleString()} <span className="text-sm font-normal text-zinc-400">PKR</span></p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="text-zinc-900 font-medium">{value || "—"}</span>
    </div>
  );
}
