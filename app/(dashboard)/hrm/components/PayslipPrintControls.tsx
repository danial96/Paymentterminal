"use client";

const PRINT_ICON = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const DOWNLOAD_ICON = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export function PayslipPrintControls({ payrollId }: { payrollId: number }) {
  function printWithLogo() {
    document.getElementById("payslip-logo")?.classList.remove("print-hide-logo");
    window.print();
  }

  function printWithoutLogo() {
    document.getElementById("payslip-logo")?.classList.add("print-hide-logo");
    window.print();
    setTimeout(() => {
      document.getElementById("payslip-logo")?.classList.remove("print-hide-logo");
    }, 2000);
  }

  function downloadPDF(withLogo: boolean) {
    const url = `/hrm/payroll/${payrollId}/pdf${withLogo ? "" : "?logo=0"}`;
    window.open(url, "_blank");
  }

  return (
    <div className="flex gap-2">
      {/* Print */}
      <button
        onClick={printWithLogo}
        className="btn-brand rounded-lg px-4 py-2 text-sm font-medium text-white flex items-center gap-2"
      >
        {PRINT_ICON} Print with Logo
      </button>
      <button
        onClick={printWithoutLogo}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
      >
        {PRINT_ICON} Print without Logo
      </button>

      {/* Divider */}
      <div className="w-px bg-zinc-200 mx-1" />

      {/* Download PDF */}
      <button
        onClick={() => downloadPDF(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 flex items-center gap-2"
      >
        {DOWNLOAD_ICON} PDF with Logo
      </button>
      <button
        onClick={() => downloadPDF(false)}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
      >
        {DOWNLOAD_ICON} PDF without Logo
      </button>
    </div>
  );
}
