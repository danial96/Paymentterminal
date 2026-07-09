"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

type SessionData = { clientSecret: string; publishableKey: string };

export default function EmbeddedCheckoutButton({
  invoiceId,
  total,
  sym,
}: {
  invoiceId: number;
  total: string;
  sym: string;
  currency: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "open" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  async function handleOpen() {
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/checkout`, { method: "POST" });
      const data: SessionData & { error?: string } = await res.json();
      if (!res.ok || !data.clientSecret) {
        setErrorMsg(data.error ?? "Failed to load payment");
        setState("error");
        return;
      }
      setSessionData(data);
      setState("open");
    } catch {
      setErrorMsg("Network error — please try again");
      setState("error");
    }
  }

  if (state === "open" && sessionData) {
    const { clientSecret, publishableKey } = sessionData;
    const stripePromise = loadStripe(publishableKey);
    const fetchClientSecret = async () => clientSecret;

    return (
      <div style={{ width: "100%", maxWidth: "640px", margin: "0 auto" }}>
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
        <button
          onClick={() => { setState("idle"); setSessionData(null); }}
          style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#aaa", fontSize: "13px", cursor: "pointer" }}
        >
          ✕ Cancel payment
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      {(state === "error") && (
        <p style={{ color: "#ef4444", fontSize: "13px", background: "#fef2f2", padding: "8px 16px", borderRadius: "6px" }}>
          ⚠ {errorMsg}
        </p>
      )}
      <p style={{ fontSize: "12px", color: "#aaa" }}>Secure payment powered by Stripe</p>
      <button
        id="pay-now-btn"
        onClick={handleOpen}
        disabled={state === "loading"}
        className="inv-pay-btn"
        style={{ cursor: state === "loading" ? "wait" : "pointer", border: "none", opacity: state === "loading" ? 0.7 : 1 }}
      >
        {state === "loading" ? (
          <>
            <span style={{
              display: "inline-block", width: "18px", height: "18px",
              border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
              borderRadius: "50%", animation: "spin 0.7s linear infinite",
            }} />
            Loading...
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay Now — {sym}{total}
          </>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
