import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { existsSync } from "fs";
import { join } from "path";
import { approvePayroll, markPayrollPaid, deletePayroll } from "@/app/actions/hrm-payroll";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";
import { PayslipSidebarActions } from "@/app/(dashboard)/hrm/components/PayslipSidebarActions";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmtEmploymentType(val?: string | null) {
  if (!val) return "Permanent";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const payroll = await prisma.hRMPayroll.findUnique({
    where: { id: Number(id) },
    include: {
      employee: { include: { department: true, designation: true } },
      items: true,
    },
  });
  if (!payroll) notFound();

  const monthStart = new Date(payroll.year, payroll.month - 1, 1);
  const monthEnd   = new Date(payroll.year, payroll.month, 0);
  const attendance = await prisma.hRMAttendance.findMany({
    where: { employeeId: payroll.employeeId, date: { gte: monthStart, lte: monthEnd } },
  });
  const presentDays = attendance.filter((a) => ["PRESENT","LATE"].includes(a.status)).length;
  const absentDays  = attendance.filter((a) => a.status === "ABSENT").length;
  const totalDays   = presentDays + absentDays;

  const emp = payroll.employee as typeof payroll.employee & {
    employeeCode?: string | null;
    phone?: string | null;
    cnicNumber?: string | null;
    email?: string | null;
    employmentType?: string | null;
  };

  const empId = (emp as { employeeCode?: string | null }).employeeCode ?? `EMP-${String(emp.id).padStart(4,"0")}`;

  const earnings   = payroll.items.filter((i) => ["allowance","bonus","overtime","commission"].includes(i.type));
  const deductions = payroll.items.filter((i) => i.type === "deduction");

  const ALLOWANCE_LABELS = ["Conveyance Allowance","House Rent Allowance","Incentive","Utility Allowance","Fuel Allowance"];

  const earningRows: { label: string; amount: number | null }[] = [
    { label: "Basic Salary", amount: Number(payroll.basicSalary) },
    ...ALLOWANCE_LABELS.map((label) => {
      const match = earnings.find((e) => e.label.toLowerCase().includes(label.split(" ")[0].toLowerCase()));
      return { label, amount: match ? Number(match.amount) : null };
    }),
    ...earnings
      .filter((e) => !ALLOWANCE_LABELS.some((l) => e.label.toLowerCase().includes(l.split(" ")[0].toLowerCase())))
      .map((e) => ({ label: e.label, amount: Number(e.amount) })),
  ];

  const maxRows = Math.max(earningRows.length, deductions.length);
  const rows = Array.from({ length: maxRows }, (_, i) => ({
    earn: earningRows[i] ?? null,
    ded:  deductions[i]  ?? null,
  }));

  const logoExists = existsSync(join(process.cwd(), "public", "ikia-logo.png"));
  const printedAt = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body * { visibility: hidden; }
          #payslip-card, #payslip-card * { visibility: visible; }
          #payslip-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            border-radius: 0;
            padding: 10mm 15mm;
            background: white;
          }
          .print-hide-logo { display: none; }
        }
        .ps-table { border-collapse: collapse; width: 100%; font-size: 11.5px; }
        .ps-table td, .ps-table th { border: 1px solid #cbd5e1; padding: 5px 9px; vertical-align: middle; overflow: hidden; }
        .ps-table th {
          background-color: #f1f5f9; font-weight: 700; text-align: center;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #334155;
        }
        .label-cell { color: #475569; font-size: 11px; }
        .val-cell { font-weight: 600; color: #0f172a; }
      ` }} />

      <div className="flex gap-6 items-start">

      {/* LEFT — payslip */}
      <div className="flex-1 max-w-2xl space-y-4 payslip-wrapper">

        {/* Screen nav */}
        <div className="no-print flex items-center gap-3">
          <Link href="/hrm/payroll" className="text-zinc-400 hover:text-zinc-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-zinc-900">Payslip</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ml-2 ${
            payroll.status === "PAID"     ? "bg-emerald-100 text-emerald-700" :
            payroll.status === "APPROVED" ? "bg-blue-100 text-blue-600"      : "bg-zinc-100 text-zinc-500"
          }`}>{payroll.status}</span>
        </div>

        {/* Tip */}
        <div className="no-print flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
          </svg>
          In Chrome print dialog, go to <strong className="mx-1">More settings → Headers and footers</strong> and turn it OFF to remove the date and URL from the printout.
        </div>

        {/* ── PAYSLIP CARD ── */}
        <div id="payslip-card" className="bg-white border border-zinc-200 rounded-xl p-8 space-y-5">

          {/* Header: date LEFT · logo RIGHT */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-700">

            {/* LEFT — Pay Slip title + date */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pay Slip</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">{MONTHS[payroll.month - 1]} {payroll.year}</p>
              <p className="text-[11px] text-slate-400 mt-1">Printed: {printedAt}</p>
              <p className="text-[11px] text-slate-400">Karachi, Pakistan</p>
            </div>

            {/* RIGHT — Logo (only rendered if file exists in public/) */}
            <div id="payslip-logo">
              {logoExists && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/ikia-logo.png" alt="IKIA TECH" className="h-16 w-auto object-contain" />
              )}
            </div>
          </div>

          {/* Employee Info Table */}
          <table className="ps-table">
            <tbody>
              <tr>
                <td className="label-cell w-36">Employee ID</td>
                <td className="val-cell">{empId}</td>
                <td className="label-cell w-36">Employee Full Name</td>
                <td className="val-cell">{emp.firstName} {emp.lastName}</td>
              </tr>
              <tr>
                <td className="label-cell">Designation</td>
                <td>{emp.designation?.name ?? "—"}</td>
                <td className="label-cell">Month &amp; Year</td>
                <td>{MONTHS[payroll.month - 1]} {payroll.year}</td>
              </tr>
              <tr>
                <td className="label-cell">Department</td>
                <td>{emp.department?.name ?? "—"}</td>
                <td className="label-cell">Employee Status</td>
                <td>{fmtEmploymentType((emp as { employmentType?: string | null }).employmentType)}</td>
              </tr>
              <tr>
                <td className="label-cell">Total Working Days</td>
                <td>{totalDays || "—"}</td>
                <td className="label-cell">No. Of Absent</td>
                <td>{absentDays}</td>
              </tr>
              <tr>
                <td className="label-cell">Contact No.</td>
                <td>{(emp as { phone?: string | null }).phone ?? "—"}</td>
                <td className="label-cell">Attendance</td>
                <td>{presentDays || "—"}</td>
              </tr>
              <tr>
                <td className="label-cell">CNIC #</td>
                <td>{(emp as { cnicNumber?: string | null }).cnicNumber ?? "—"}</td>
                <td className="label-cell">Email Address</td>
                <td>{(emp as { email?: string | null }).email ?? "—"}</td>
              </tr>
            </tbody>
          </table>

          {/* Earnings & Deductions */}
          <table className="ps-table">
            <thead>
              <tr>
                <th colSpan={2} style={{ borderRight: "2px solid #94a3b8" }}>EARNINGS</th>
                <th colSpan={2}>DEDUCTIONS</th>
              </tr>
              <tr>
                <th className="text-left" style={{ width: "36%" }}>Description</th>
                <th style={{ width: "14%", borderRight: "2px solid #94a3b8" }}>Amount</th>
                <th className="text-left" style={{ width: "36%" }}>Description</th>
                <th style={{ width: "14%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="label-cell">{row.earn?.label ?? " "}</td>
                  <td className="text-right" style={{ borderRight: "2px solid #94a3b8" }}>
                    {row.earn?.amount != null
                      ? row.earn.label === "Basic Salary"
                        ? <span className="font-semibold">{row.earn.amount.toLocaleString()}</span>
                        : row.earn.amount > 0
                          ? <span className="text-emerald-600">+{row.earn.amount.toLocaleString()}</span>
                          : <span className="text-slate-400">—</span>
                      : " "}
                  </td>
                  <td className="label-cell">{row.ded?.label ?? " "}</td>
                  <td className="text-right">
                    {row.ded ? <span className="text-red-500">-{Number(row.ded.amount).toLocaleString()}</span> : " "}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #94a3b8", background: "#f8fafc" }}>
                <td className="font-bold text-slate-700">Gross Salary</td>
                <td className="text-right font-bold" style={{ borderRight: "2px solid #94a3b8" }}>
                  {Number(payroll.grossSalary).toLocaleString()}
                </td>
                <td className="font-bold text-slate-700">Total Deductions</td>
                <td className="text-right font-bold text-red-600">-{Number(payroll.totalDeductions).toLocaleString()}</td>
              </tr>
              <tr style={{ background: "#eef2ff" }}>
                <td colSpan={3} className="text-center font-extrabold text-slate-800 text-sm tracking-wide">NET SALARY</td>
                <td className="text-right font-extrabold text-indigo-700 text-base">{Number(payroll.netSalary).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {payroll.notes && (
            <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2">{payroll.notes}</p>
          )}

          <p className="text-center text-[11px] text-slate-400 border-t border-slate-200 pt-3 italic">
            This is a Computer-Generated Document &amp; does not require Signature.
          </p>
        </div>

      </div>{/* end left payslip column */}

      {/* RIGHT — action buttons, sticky */}
      <div className="no-print sticky top-6 flex flex-col gap-3 min-w-[180px]">

        {payroll.status === "DRAFT" && (
          <form action={approvePayroll.bind(null, payroll.id)}>
            <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 flex items-center justify-center gap-2">
              Approve
            </button>
          </form>
        )}
        {payroll.status === "APPROVED" && (
          <form action={markPayrollPaid.bind(null, payroll.id)}>
            <button type="submit" className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 flex items-center justify-center gap-2">
              Mark as Paid
            </button>
          </form>
        )}

        <hr className="border-zinc-200" />

        <PayslipSidebarActions payrollId={payroll.id} />

        <hr className="border-zinc-200" />

        <form action={deletePayroll.bind(null, payroll.id)}>
          <DeleteButton className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center justify-center gap-2" message="Delete this payroll record?">
            Delete
          </DeleteButton>
        </form>
      </div>

      </div>{/* end outer flex */}
    </>
  );
}
