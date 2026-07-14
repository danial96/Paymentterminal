import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { existsSync } from "fs";
import { join } from "path";
import { requireUser } from "@/lib/scope";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmtEmploymentType(val?: string | null) {
  if (!val) return "Permanent";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PayslipPDFPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ logo?: string; margin?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { logo, margin } = await searchParams;
  const showLogo = logo !== "0" && existsSync(join(process.cwd(), "public", "ikia-logo.png"));
  const topMarginMm = Math.min(100, Math.max(0, Number(margin ?? "10")));

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
    employeeCode?: string | null; phone?: string | null;
    cnicNumber?: string | null; email?: string | null; employmentType?: string | null;
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

  const printedAt = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Payslip — {payroll.employee.firstName} {payroll.employee.lastName} — {MONTHS[payroll.month - 1]} {payroll.year}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #1e293b;
            background: white;
            display: flex;
            justify-content: center;
            padding: ${topMarginMm}mm 14mm 10mm;
          }
          @page { margin: 0; size: A4 portrait; }
          @media print {
            body { padding: ${topMarginMm}mm 14mm 10mm; }
          }
          .card { width: 100%; max-width: 180mm; }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 10px;
            border-bottom: 2px solid #334155;
            margin-bottom: 14px;
          }
          .header-left .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .header-left .month { font-size: 22px; font-weight: 900; color: #4f46e5; margin-top: 2px; }
          .header-left .sub { font-size: 10px; color: #94a3b8; margin-top: 3px; }
          .logo { height: 56px; width: auto; object-fit: contain; }

          /* Tables */
          table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
          td, th { border: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: middle; }
          th {
            background: #f1f5f9;
            font-weight: 700;
            text-align: center;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #334155;
          }
          .label-cell { color: #475569; font-size: 11px; }
          .val-cell   { font-weight: 600; }
          .sep { border-right: 2px solid #94a3b8; }
          .earn-green { color: #16a34a; }
          .ded-red    { color: #dc2626; font-weight: 600; }
          .gross-row  { background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; }
          .net-row    { background: #eef2ff; }
          .net-label  { text-align: center; font-size: 13px; font-weight: 900; color: #1e293b; }
          .net-amount { text-align: right; font-size: 15px; font-weight: 900; color: #4f46e5; }
          .tr { text-align: right; }

          /* Footer */
          .footer { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; font-style: italic; margin-top: 4px; }
        `}</style>
      </head>
      <body>
        <div className="card">

          {/* Header */}
          <div className="header">
            <div className="header-left">
              <p className="label">Pay Slip</p>
              <p className="month">{MONTHS[payroll.month - 1]} {payroll.year}</p>
              <p className="sub">Printed: {printedAt}</p>
              <p className="sub">Karachi, Pakistan</p>
            </div>
            {showLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/ikia-logo.png" alt="IKIA TECH" className="logo" />
            )}
          </div>

          {/* Employee Info */}
          <table>
            <tbody>
              <tr>
                <td className="label-cell" style={{ width: "22%" }}>Employee ID</td>
                <td className="val-cell">{empId}</td>
                <td className="label-cell" style={{ width: "22%" }}>Employee Full Name</td>
                <td className="val-cell">{emp.firstName} {emp.lastName}</td>
              </tr>
              <tr>
                <td className="label-cell">Designation</td>
                <td>{emp.designation?.name ?? "—"}</td>
                <td className="label-cell">Month & Year</td>
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
          <table>
            <thead>
              <tr>
                <th colSpan={2} className="sep">EARNINGS</th>
                <th colSpan={2}>DEDUCTIONS</th>
              </tr>
              <tr>
                <th style={{ textAlign: "left", width: "36%" }}>Description</th>
                <th className="sep" style={{ width: "14%" }}>Amount</th>
                <th style={{ textAlign: "left", width: "36%" }}>Description</th>
                <th style={{ width: "14%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="label-cell">{row.earn?.label ?? " "}</td>
                  <td className="tr sep">
                    {row.earn?.amount != null
                      ? row.earn.label === "Basic Salary"
                        ? <strong>{row.earn.amount.toLocaleString()}</strong>
                        : row.earn.amount > 0
                          ? <span className="earn-green">+{row.earn.amount.toLocaleString()}</span>
                          : <span style={{ color: "#94a3b8" }}>—</span>
                      : " "}
                  </td>
                  <td className="label-cell">{row.ded?.label ?? " "}</td>
                  <td className="tr">
                    {row.ded ? <span className="ded-red">-{Number(row.ded.amount).toLocaleString()}</span> : " "}
                  </td>
                </tr>
              ))}
              <tr className="gross-row">
                <td>Gross Salary</td>
                <td className="tr sep">{Number(payroll.grossSalary).toLocaleString()}</td>
                <td>Total Deductions</td>
                <td className="tr ded-red">-{Number(payroll.totalDeductions).toLocaleString()}</td>
              </tr>
              <tr className="net-row">
                <td colSpan={3} className="net-label">NET SALARY</td>
                <td className="net-amount">{Number(payroll.netSalary).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {payroll.notes && (
            <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", marginBottom: "8px" }}>{payroll.notes}</p>
          )}

          <p className="footer">This is a Computer-Generated Document &amp; does not require Signature.</p>
        </div>

        {/* Auto-trigger print on load */}
        <script dangerouslySetInnerHTML={{ __html: `window.onload = function(){ window.print(); }` }} />
      </body>
    </html>
  );
}
