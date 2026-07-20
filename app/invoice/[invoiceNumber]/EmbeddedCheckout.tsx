"use client";

import { useState } from "react";
import { loadStripe, StripeCardNumberElement } from "@stripe/stripe-js";
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

const ELEMENT_STYLE = {
  base: {
    fontSize: "14px",
    color: "#1a1a1a",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "::placeholder": { color: "#aaa" },
  },
  invalid: { color: "#ef4444" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #e0e0e0",
  borderRadius: "6px",
  fontSize: "14px",
  fontFamily: "inherit",
  color: "#1a1a1a",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const stripeWrap: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #e0e0e0",
  borderRadius: "6px",
  background: "#fff",
};

function PayForm({
  clientSecret,
  total,
  sym,
  invoiceNumber,
  invoiceId,
  onCancel,
}: {
  clientSecret: string;
  total: string;
  sym: string;
  invoiceNumber: string;
  invoiceId: number;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const cardNumber = elements.getElement(CardNumberElement) as StripeCardNumberElement;
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: { name, email },
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setPaying(false);
    } else if (paymentIntent?.status === "succeeded") {
      // Mark invoice as paid immediately (webhook is backup)
      await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: "POST" }).catch(() => {});
      setSuccess(true);
      setTimeout(() => {
        window.location.href = `/invoice/${invoiceNumber}?paid=1`;
      }, 1500);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px", color: "#16a34a" }}><FontAwesomeIcon icon={faCheck} /></div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#16a34a" }}>Payment successful!</div>
        <div style={{ fontSize: "13px", color: "#aaa", marginTop: "6px" }}>Redirecting...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", maxWidth: "440px", margin: "0 auto" }}>
      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#555", display: "block", marginBottom: "6px" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#555", display: "block", marginBottom: "6px" }}>Card information</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0", border: "1px solid #e0e0e0", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #e0e0e0" }}>
            <CardNumberElement options={{ style: ELEMENT_STYLE, showIcon: true }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "10px 12px", borderRight: "1px solid #e0e0e0" }}>
              <CardExpiryElement options={{ style: ELEMENT_STYLE }} />
            </div>
            <div style={{ padding: "10px 12px" }}>
              <CardCvcElement options={{ style: ELEMENT_STYLE }} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#555", display: "block", marginBottom: "6px" }}>Cardholder name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name on card"
          required
          style={inputStyle}
        />
      </div>

      {error && (
        <div style={{ fontSize: "13px", color: "#ef4444", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={paying || !stripe}
        style={{
          background: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "12px",
          fontSize: "15px",
          fontWeight: 600,
          cursor: paying ? "wait" : "pointer",
          opacity: paying ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontFamily: "inherit",
        }}
      >
        {paying ? (
          <><span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} /> Processing...</>
        ) : (
          `Pay ${sym}${total}`
        )}
      </button>

      <button type="button" onClick={onCancel} style={{ background: "none", border: "none", color: "#aaa", fontSize: "13px", cursor: "pointer", marginTop: "-6px" }}>
        <FontAwesomeIcon icon={faXmark} style={{ marginRight: "4px" }} />Cancel payment
      </button>

      <p style={{ textAlign: "center", fontSize: "11px", color: "#ccc", margin: 0 }}>Powered by <strong>Stripe</strong> · Secure payment</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

export default function EmbeddedCheckoutButton({
  invoiceId,
  total,
  sym,
  invoiceNumber,
}: {
  invoiceId: number;
  total: string;
  sym: string;
  currency: string;
  invoiceNumber?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "open" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);

  async function handleOpen() {
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/checkout`, { method: "POST" });
      const data: { clientSecret?: string; publishableKey?: string; error?: string } = await res.json();
      if (!res.ok || !data.clientSecret || !data.publishableKey) {
        setErrorMsg(data.error ?? "Failed to load payment");
        setState("error");
        return;
      }
      setClientSecret(data.clientSecret);
      setStripePromise(loadStripe(data.publishableKey));
      setState("open");
    } catch {
      setErrorMsg("Network error — please try again");
      setState("error");
    }
  }

  if (state === "open" && clientSecret && stripePromise) {
    return (
      <div style={{ width: "100%", padding: "24px 16px" }}>
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <PayForm
            clientSecret={clientSecret}
            total={total}
            sym={sym}
            invoiceNumber={invoiceNumber ?? ""}
            invoiceId={invoiceId}
            onCancel={() => { setState("idle"); setClientSecret(null); }}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      {state === "error" && (
        <p style={{ color: "#ef4444", fontSize: "13px", background: "#fef2f2", padding: "8px 16px", borderRadius: "6px" }}>
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: "6px" }} />{errorMsg}
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
            <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
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
