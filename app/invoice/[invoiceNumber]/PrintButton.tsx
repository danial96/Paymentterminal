"use client";

export default function PrintButton({
  clientName,
  invoiceNumber,
  inside,
}: {
  clientName: string;
  invoiceNumber: string;
  inside?: boolean;
}) {
  function handleDownload() {
    const w = window.open(
      `/invoice/${invoiceNumber}?preview=1`,
      "_blank",
      "width=900,height=750,scrollbars=yes"
    );
    if (w) {
      w.addEventListener("load", () => {
        w.document.title = `${clientName} ${invoiceNumber}`;
        setTimeout(() => w.print(), 300);
      });
    }
  }

  if (inside) {
    return (
      <button
        onClick={handleDownload}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          background: "#1e2330",
          color: "#fff",
          fontSize: "12px",
          fontWeight: 600,
          padding: "9px 18px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        Save as PDF
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="inv-print-btn"
      aria-label="Save as PDF"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      Save as PDF
    </button>
  );
}
