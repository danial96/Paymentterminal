"use client";

import { useState } from "react";

const PRINT_ICON = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
const DL_ICON    = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

export function PayslipSidebarActions({ payrollId }: { payrollId: number }) {
  const [topMargin, setTopMargin] = useState(10);

  function applyTopMargin() {
    const card = document.getElementById("payslip-card");
    if (card) card.style.paddingTop = `${topMargin}mm`;
  }

  function resetTopMargin() {
    const card = document.getElementById("payslip-card");
    if (card) card.style.paddingTop = "";
  }

  function printWithLogo() {
    applyTopMargin();
    document.getElementById("payslip-logo")?.classList.remove("print-hide-logo");
    window.print();
    resetTopMargin();
  }

  function printWithoutLogo() {
    applyTopMargin();
    document.getElementById("payslip-logo")?.classList.add("print-hide-logo");
    window.print();
    setTimeout(() => {
      document.getElementById("payslip-logo")?.classList.remove("print-hide-logo");
      resetTopMargin();
    }, 2000);
  }

  function downloadPDF(withLogo: boolean) {
    window.open(`/hrm/payroll/${payrollId}/pdf?logo=${withLogo ? "1" : "0"}&margin=${topMargin}`, "_blank");
  }

  const btn = "w-full rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors";

  return (
    <>
      {/* Top margin control */}
      <div className="rounded-lg border border-zinc-200 p-3 space-y-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Top Margin (mm)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={topMargin}
            onChange={(e) => setTopMargin(Number(e.target.value))}
            className="w-full rounded border border-zinc-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-xs text-zinc-400 shrink-0">mm</span>
        </div>
        <p className="text-[11px] text-zinc-400">Increase for letterhead paper</p>
      </div>

      <button onClick={printWithLogo}    className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>{PRINT_ICON} Print with Logo</button>
      <button onClick={printWithoutLogo} className={`${btn} border border-zinc-300 text-zinc-700 hover:bg-zinc-50`}>{PRINT_ICON} Print without Logo</button>
      <hr className="border-zinc-200" />
      <button onClick={() => downloadPDF(true)}  className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>{DL_ICON} PDF with Logo</button>
      <button onClick={() => downloadPDF(false)} className={`${btn} border border-emerald-300 text-emerald-700 hover:bg-emerald-50`}>{DL_ICON} PDF without Logo</button>
    </>
  );
}
