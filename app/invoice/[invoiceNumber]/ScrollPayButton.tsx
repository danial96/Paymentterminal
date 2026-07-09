"use client";

export default function ScrollPayButton({ total, sym }: { total: string; sym: string }) {
  function handleClick() {
    const section = document.getElementById("pay-section");
    if (!section) return;
    // Trigger payment load first, then scroll after delay
    const payBtn = document.getElementById("pay-now-btn");
    if (payBtn) payBtn.click();
    setTimeout(() => {
      section.scrollIntoView({ behavior: "smooth" });
    }, 1400);
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 800,
        padding: "11px 24px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
        letterSpacing: "0.2px",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
      </svg>
      Pay Now — {sym}{total}
    </button>
  );
}
