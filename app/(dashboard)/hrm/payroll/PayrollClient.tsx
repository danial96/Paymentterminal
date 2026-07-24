"use client";

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { generatePayroll, approvePayroll, markPayrollPaid } from "@/app/actions/hrm-payroll";
import { fulfillPayslipRequest, rejectPayslipRequest } from "@/app/actions/hrm-payslip-request";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     "bg-zinc-100 text-zinc-500",
  APPROVED:  "bg-blue-100 text-blue-700",
  PAID:      "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-zinc-200 text-zinc-500",
};
const REQ_STATUS: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  FULFILLED: "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100 text-red-600",
};

type Employee = { id: number; firstName: string; lastName: string; basicSalary: number | null; allowances: { amount: number }[]; deductions: { amount: number }[]; designation: { name: string } | null; department: { name: string } | null };
type Payroll  = { id: number; month: number; year: number; basicSalary: number; allowances: number; grossSalary: number; totalDeductions: number; netSalary: number; status: string; employee: { firstName: string; lastName: string; designation: { name: string } | null } };
type Request  = { id: number; month: number; year: number; toMonth: number | null; toYear: number | null; status: string; hrNote: string | null; createdAt: string; employee: { firstName: string; lastName: string; employeeId: string } };

interface Props {
  employees: Employee[];
  payrolls: Payroll[];
  requests: Request[];
  filterMonth: number;
  filterYear: number;
  pendingCount: number;
}

export default function PayrollClient({ employees, payrolls, requests, filterMonth, filterYear, pendingCount }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"payslips" | "requests">("payslips");
  const [showModal, setShowModal] = useState(false);
  const [generating, startGenerate] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Filter state
  const [fMonth, setFMonth] = useState(filterMonth);
  const [fYear,  setFYear]  = useState(filterYear);
  const [fEmp,   setFEmp]   = useState("");

  const now = new Date();

  // Totals
  const filtered = payrolls.filter(p =>
    (!fEmp || String(p.employee && employees.find(e => `${e.firstName} ${e.lastName}` === `${p.employee.firstName} ${p.employee.lastName}`)?.id) === fEmp)
  );
  const totalGross      = filtered.reduce((s, p) => s + Number(p.grossSalary), 0);
  const totalDeductions = filtered.reduce((s, p) => s + Number(p.totalDeductions), 0);
  const totalNet        = filtered.reduce((s, p) => s + Number(p.netSalary), 0);

  function applyFilter() {
    const params = new URLSearchParams({ month: String(fMonth), year: String(fYear) });
    if (fEmp) params.set("emp", fEmp);
    router.push(`/hrm/payroll?${params}`);
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    startGenerate(async () => {
      const result = await generatePayroll(fd);
      setShowModal(false);
      if (result?.id) {
        router.push(`/hrm/payroll/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  // Selected employee for modal preview
  const [selEmpId, setSelEmpId] = useState("");
  const selEmp = employees.find(e => String(e.id) === selEmpId);
  const previewBasic = selEmp ? Number(selEmp.basicSalary ?? 0) : 0;
  const previewAllowances = selEmp ? selEmp.allowances.reduce((s, a) => s + Number(a.amount), 0) : 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Payroll</h1>
          <p className="text-sm text-zinc-500">{MONTHS[filterMonth - 1]} {filterYear}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          + Generate Payslip
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {(["payslips", "requests"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}
          >
            {t === "payslips" ? "All Payslips" : (
              <span className="flex items-center gap-1.5">
                Requests
                {pendingCount > 0 && <span className="rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5">{pendingCount}</span>}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── PAYSLIPS TAB ── */}
      {tab === "payslips" && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Gross", value: totalGross },
              { label: "Deductions", value: totalDeductions },
              { label: "Net Payable", value: totalNet },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs text-zinc-400">{label}</p>
                <p className="text-xl font-bold text-zinc-900 mt-0.5">{Number(value).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 items-center flex-wrap">
            <select value={fMonth} onChange={e => setFMonth(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={fYear} onChange={e => setFYear(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
              {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(y => <option key={y}>{y}</option>)}
            </select>
            <select value={fEmp} onChange={e => setFEmp(e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
            <button onClick={applyFilter} className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white">Filter</button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-right">Basic</th>
                  <th className="px-4 py-3 text-right">Allowances</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payrolls.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-zinc-400 text-sm">
                      No payslips for {MONTHS[filterMonth - 1]} {filterYear}.
                      <button onClick={() => setShowModal(true)} className="block mx-auto mt-2 text-zinc-700 hover:underline">Generate one →</button>
                    </td>
                  </tr>
                )}
                {payrolls.map(p => (
                  <PayrollRow key={p.id} p={p} onRefresh={() => router.refresh()} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <RequestsPanel requests={requests} onRefresh={() => router.refresh()} />
      )}

      {/* ── GENERATE MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Generate Payslip</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form ref={formRef} onSubmit={handleGenerate} className="p-6 space-y-5">
              {/* Employee / Month / Year */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Employee *</label>
                  <select name="employeeId" required value={selEmpId} onChange={e => setSelEmpId(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                    <option value="">Select employee</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} {e.basicSalary ? `(${Number(e.basicSalary).toLocaleString()})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Month *</label>
                  <select name="month" defaultValue={now.getMonth() + 1} required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                    {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Year *</label>
                  <select name="year" defaultValue={now.getFullYear()} required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                    {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Auto-detected preview */}
              {selEmp && (
                <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-4 py-3 text-xs text-zinc-500 space-y-0.5">
                  <p><span className="font-medium text-zinc-700">Basic Salary:</span> {previewBasic.toLocaleString()}</p>
                  <p><span className="font-medium text-zinc-700">Recurring Allowances:</span> +{previewAllowances.toLocaleString()}</p>
                  <p className="text-[11px] text-zinc-400">Late/absent deductions calculated automatically from attendance.</p>
                </div>
              )}

              <hr className="border-zinc-100" />
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Earnings (Additional)</p>
              <div className="grid grid-cols-2 gap-3">
                {[["bonuses","Bonus"],["overtimePay","Overtime Pay"],["commission","Commission"]].map(([n,l]) => (
                  <div key={n}>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{l}</label>
                    <input name={n} type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
                  </div>
                ))}
              </div>

              <hr className="border-zinc-100" />
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Deductions (Additional)</p>
              <div className="grid grid-cols-2 gap-3">
                {[["taxDeduction","Tax"],["pfDeduction","Provident Fund"],["eobiDeduction","EOBI"],["loanDeduction","Loan"],["advanceDeduction","Advance"],["otherDeductions","Other"]].map(([n,l]) => (
                  <div key={n}>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{l}</label>
                    <input name={n} type="number" step="0.01" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={generating}
                  className="flex-1 btn-brand rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2">
                  {generating && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                  {generating ? "Generating..." : "Generate Payslip"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Individual payroll row with inline approve/paid/pdf/print ──
function PayrollRow({ p, onRefresh }: { p: Payroll; onRefresh: () => void }) {
  const [approvePending, startApprove] = useTransition();
  const [paidPending,    startPaid]    = useTransition();

  return (
    <tr className="hover:bg-zinc-50">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900">{p.employee.firstName} {p.employee.lastName}</p>
        <p className="text-xs text-zinc-400">{p.employee.designation?.name ?? "—"}</p>
      </td>
      <td className="px-4 py-3 text-right text-sm">{Number(p.basicSalary).toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm text-zinc-600">+{Number(p.allowances).toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm font-medium">{Number(p.grossSalary).toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm text-zinc-600">-{Number(p.totalDeductions).toLocaleString()}</td>
      <td className="px-4 py-3 text-right text-sm font-bold text-zinc-900">{Number(p.netSalary).toLocaleString()}</td>
      <td className="px-4 py-3 text-center">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[p.status] ?? "bg-zinc-100"}`}>{p.status}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {/* PDF / Print */}
          <a href={`/hrm/payroll/${p.id}`}
            className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50 flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            View
          </a>
          <a href={`/hrm/payroll/${p.id}/pdf?logo=1`} target="_blank"
            className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50 flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print / PDF
          </a>
          {/* Status actions */}
          {p.status === "DRAFT" && (
            <button disabled={approvePending} onClick={() => startApprove(async () => { await approvePayroll(p.id); onRefresh(); })}
              className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
              {approvePending ? "..." : "Approve"}
            </button>
          )}
          {p.status === "APPROVED" && (
            <button disabled={paidPending} onClick={() => startPaid(async () => { await markPayrollPaid(p.id); onRefresh(); })}
              className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
              {paidPending ? "..." : "Mark Paid"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Requests panel ──
function RequestsPanel({ requests, onRefresh }: { requests: Request[]; onRefresh: () => void }) {
  const pending = requests.filter(r => r.status === "PENDING");
  const done    = requests.filter(r => r.status !== "PENDING");

  function period(r: Request) {
    const from = `${MONTHS[r.month - 1]} ${r.year}`;
    if (r.toMonth && r.toYear) return `${from} → ${MONTHS[r.toMonth - 1]} ${r.toYear}`;
    return from;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Pending ({pending.length})</p>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">No pending requests.</div>
        ) : (
          <div className="space-y-3">
            {pending.map(r => <RequestCard key={r.id} r={r} period={period(r)} onRefresh={onRefresh} />)}
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">History</p>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs">HR Note</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500 text-xs">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {done.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-900">{r.employee.firstName} {r.employee.lastName} <span className="text-xs text-zinc-400">{r.employee.employeeId}</span></td>
                    <td className="px-4 py-3 text-zinc-700">{period(r)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${REQ_STATUS[r.status] ?? "bg-zinc-100 text-zinc-500"}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-zinc-400 text-xs max-w-[200px] truncate">{r.hrNote ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({ r, period, onRefresh }: { r: Request; period: string; onRefresh: () => void }) {
  const [note, setNote] = useState("");
  const [fulfillPending, startFulfill] = useTransition();
  const [rejectPending,  startReject]  = useTransition();
  const [done, setDone] = useState<string | null>(null);

  if (done) return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 opacity-60">
      <p className="text-sm text-zinc-500">{r.employee.firstName} {r.employee.lastName} — <span className="font-semibold">{done}</span></p>
    </div>
  );

  function act(type: "fulfill" | "reject") {
    const fd = new FormData();
    fd.set("id", String(r.id));
    if (note.trim()) fd.set("hrNote", note.trim());
    if (type === "fulfill") {
      startFulfill(async () => { await fulfillPayslipRequest(fd); setDone("FULFILLED"); onRefresh(); });
    } else {
      startReject(async () => { await rejectPayslipRequest(fd); setDone("REJECTED"); onRefresh(); });
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {r.employee.firstName} {r.employee.lastName}
            <span className="ml-2 text-xs text-zinc-400 font-normal">{r.employee.employeeId}</span>
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Period: <span className="font-medium text-zinc-700">{period}</span>
            <span className="ml-3 text-zinc-400">{new Date(r.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${REQ_STATUS[r.status]}`}>{r.status}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] font-medium text-zinc-500 mb-1">HR Note (optional)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Sent via email"
            className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => act("fulfill")} disabled={fulfillPending || rejectPending}
            className="btn-brand rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5">
            {fulfillPending && <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
            Fulfill
          </button>
          <button onClick={() => act("reject")} disabled={fulfillPending || rejectPending}
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
