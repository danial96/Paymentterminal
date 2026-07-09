"use client";

export default function PrintButton({ clientName, invoiceNumber }: { clientName: string; invoiceNumber: string }) {
  function handlePrint() {
    const original = document.title;
    document.title = `${clientName} - ${invoiceNumber}`;
    window.print();
    document.title = original;
  }

  return (
    <button
      onClick={handlePrint}
      className="inv-print-btn"
      aria-label="Download PDF"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      Download PDF
    </button>
  );
}
