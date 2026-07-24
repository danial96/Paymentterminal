import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { existsSync } from "fs";
import { join } from "path";
import { requireUser } from "@/lib/scope";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-PK");
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
  const absentDays  = attendance.filter(a => a.status === "ABSENT").length;
  const totalDays   = presentDays + absentDays;

  const emp = payroll.employee;
  const empId = emp.employeeId ?? `EMP-${String(emp.id).padStart(4,"0")}`;

  // Only show items that actually exist (no placeholder empty rows)
  const earnings   = payroll.items.filter(i => ["allowance","bonus","overtime","commission"].includes(i.type) && Number(i.amount) > 0);
  const deductions = payroll.items.filter(i => i.type === "deduction" && Number(i.amount) > 0);

  const maxRows = Math.max(earnings.length, deductions.length);
  const rows = Array.from({ length: maxRows }, (_, i) => ({
    earn: earnings[i]   ?? null,
    ded:  deductions[i] ?? null,
  }));

  const printedAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Payslip — {emp.firstName} {emp.lastName} — {MONTHS[payroll.month - 1]} {payroll.year}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11.5px;
            color: #1a1a2e;
            background: #fff;
            display: flex;
            justify-content: center;
            padding: ${topMarginMm}mm 12mm 10mm;
          }
          @page { margin: 0; size: A4 portrait; }
          @media print { body { padding: ${topMarginMm}mm 12mm 10mm; } }

          .wrap { width: 100%; max-width: 186mm; }

          /* ── Header ── */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 3px solid #1a1a2e;
            margin-bottom: 14px;
          }
          .company-name {
            font-size: 20px;
            font-weight: 900;
            color: #1a1a2e;
            letter-spacing: -0.5px;
          }
          .payslip-tag {
            display: inline-block;
            background: #1a1a2e;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 3px;
            margin-bottom: 4px;
          }
          .period { font-size: 22px; font-weight: 900; color: #2563eb; margin-top: 2px; }
          .sub { font-size: 9.5px; color: #6b7280; margin-top: 2px; }
          .logo { height: 52px; width: auto; object-fit: contain; }

          /* ── Info Grid ── */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 14px;
          }
          .info-cell {
            display: flex;
            align-items: center;
            padding: 6px 10px;
            border-bottom: 1px solid #e5e7eb;
            gap: 6px;
          }
          .info-cell:nth-last-child(-n+2) { border-bottom: none; }
          .info-cell.full { grid-column: 1 / -1; }
          .info-label { color: #6b7280; font-size: 10px; min-width: 110px; flex-shrink: 0; }
          .info-value { font-weight: 600; color: #111827; font-size: 11px; }
          .info-cell-odd { background: #f9fafb; }

          /* ── Section header ── */
          .section-head {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid #d1d5db;
            border-bottom: none;
            border-radius: 6px 6px 0 0;
            overflow: hidden;
          }
          .section-head-cell {
            background: #1a1a2e;
            color: #fff;
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 7px 0;
          }
          .section-head-cell:first-child { border-right: 1px solid #374151; }

          /* ── Table ── */
          table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
          .main-table { border: 1px solid #d1d5db; border-radius: 0 0 6px 6px; overflow: hidden; }
          td {
            padding: 5.5px 10px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: middle;
          }
          .col-desc { width: 37%; color: #374151; font-size: 11px; }
          .col-amt  { width: 13%; text-align: right; font-weight: 600; font-size: 11px; }
          .col-sep  { border-right: 2px solid #d1d5db; }
          .earn-val { color: #15803d; }
          .ded-val  { color: #dc2626; }
          .sub-head td { background: #f3f4f6; font-size: 10px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; }
          .gross-row td { background: #f8fafc; font-weight: 700; border-top: 2px solid #9ca3af; font-size: 11.5px; border-bottom: none; }
          .net-row td {
            background: #1a1a2e;
            color: #fff;
            font-weight: 900;
            font-size: 13.5px;
            padding: 9px 10px;
            border-bottom: none;
          }
          .net-label { text-align: center; letter-spacing: 0.05em; font-size: 12px; }
          .net-amount { text-align: right; color: #60a5fa; font-size: 16px; }

          /* ── Footer ── */
          .footer {
            text-align: center;
            font-size: 9.5px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            margin-top: 4px;
            font-style: italic;
          }
        `}</style>
      </head>
      <body>
        <div className="wrap">

          {/* Header */}
          <div className="header">
            <div>
              <div className="payslip-tag">Pay Slip</div>
              <div className="period">{MONTHS[payroll.month - 1]} {payroll.year}</div>
              <div className="sub">Printed: {printedAt} &nbsp;·&nbsp; Karachi, Pakistan</div>
            </div>
            {showLogo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src="/ikia-logo.png" alt="IKIA TECH" className="logo" />
              : <div className="company-name">IKIA TECH</div>
            }
          </div>

          {/* Employee Info */}
          <div className="info-grid">
            <div className="info-cell info-cell-odd">
              <span className="info-label">Employee ID</span>
              <span className="info-value">{empId}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">Full Name</span>
              <span className="info-value">{emp.firstName} {emp.lastName}</span>
            </div>
            <div className="info-cell info-cell-odd">
              <span className="info-label">Designation</span>
              <span className="info-value">{emp.designation?.name ?? "—"}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">Department</span>
              <span className="info-value">{emp.department?.name ?? "—"}</span>
            </div>
            <div className="info-cell info-cell-odd">
              <span className="info-label">Employment Type</span>
              <span className="info-value">{emp.employmentType?.replace(/_/g," ") ?? "—"}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">Month & Year</span>
              <span className="info-value">{MONTHS[payroll.month - 1]} {payroll.year}</span>
            </div>
            <div className="info-cell info-cell-odd">
              <span className="info-label">Working Days</span>
              <span className="info-value">{totalDays || "—"}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">Days Present</span>
              <span className="info-value">{presentDays || "—"}</span>
            </div>
            <div className="info-cell info-cell-odd">
              <span className="info-label">Days Absent</span>
              <span className="info-value" style={{ color: absentDays > 0 ? "#dc2626" : undefined }}>{absentDays}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">Contact No.</span>
              <span className="info-value">{(emp as any).phone ?? "—"}</span>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="section-head">
            <div className="section-head-cell">Earnings</div>
            <div className="section-head-cell">Deductions</div>
          </div>
          <table className="main-table">
            <tbody>
              {/* Sub-headers */}
              <tr className="sub-head">
                <td className="col-desc col-sep">Description</td>
                <td className="col-amt col-sep">Amount</td>
                <td className="col-desc">Description</td>
                <td className="col-amt">Amount</td>
              </tr>

              {/* Basic salary row */}
              <tr>
                <td className="col-desc col-sep" style={{ fontWeight: 700 }}>Basic Salary</td>
                <td className="col-amt col-sep" style={{ fontWeight: 700 }}>{fmt(Number(payroll.basicSalary))}</td>
                <td className="col-desc">{rows[0]?.ded?.label ?? ""}</td>
                <td className="col-amt ded-val">{rows[0]?.ded ? `-${fmt(Number(rows[0].ded.amount))}` : ""}</td>
              </tr>

              {/* Allowances + remaining deductions */}
              {Array.from({ length: Math.max(earnings.length, deductions.length - 1) }, (_, i) => ({
                earn: earnings[i] ?? null,
                ded:  deductions[i + 1] ?? null,
              })).map((row, i) => (
                <tr key={i}>
                  <td className="col-desc col-sep">{row.earn?.label ?? ""}</td>
                  <td className="col-amt col-sep earn-val">{row.earn ? `+${fmt(Number(row.earn.amount))}` : ""}</td>
                  <td className="col-desc">{row.ded?.label ?? ""}</td>
                  <td className="col-amt ded-val">{row.ded ? `-${fmt(Number(row.ded.amount))}` : ""}</td>
                </tr>
              ))}

              {/* Gross / Total deductions */}
              <tr className="gross-row">
                <td className="col-desc col-sep">Gross Salary</td>
                <td className="col-amt col-sep">{fmt(Number(payroll.grossSalary))}</td>
                <td className="col-desc">Total Deductions</td>
                <td className="col-amt ded-val">-{fmt(Number(payroll.totalDeductions))}</td>
              </tr>

              {/* Net */}
              <tr className="net-row">
                <td colSpan={3} className="net-label">NET SALARY</td>
                <td className="net-amount">{fmt(Number(payroll.netSalary))}</td>
              </tr>
            </tbody>
          </table>

          {payroll.notes && (
            <p style={{ fontSize: "10.5px", color: "#6b7280", fontStyle: "italic", marginBottom: "8px" }}>
              Note: {payroll.notes}
            </p>
          )}

          <p className="footer">This is a Computer-Generated Document &amp; does not require a Signature.</p>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `window.onload=function(){window.print();}` }} />
      </body>
    </html>
  );
}
