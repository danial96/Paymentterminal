import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmbeddedCheckoutButton from "./EmbeddedCheckout";
import ScrollPayButton from "./ScrollPayButton";

const CURRENCY_SYMBOLS: Record<string, string> = { gbp: "£", usd: "$", eur: "€", pkr: "₨" };

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { invoiceNumber } });
  if (!invoice) notFound();

  const brand = invoice.brandId
    ? await prisma.brand.findUnique({ where: { id: invoice.brandId } })
    : null;

  const items = invoice.items as { description: string; quantity: number; unitPrice: number }[];
  const sym = CURRENCY_SYMBOLS[invoice.currency] ?? "£";
  const isPaid = invoice.status === "paid";

  const styles = `
    html { scroll-behavior: smooth; }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    .inv-wrap { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f5f7; min-height: 100vh; padding: 32px 16px; color: #1a1a2e; }
    .inv-page { max-width: 820px; margin: 0 auto; }
    .inv-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .inv-status-bar { padding: 9px 40px; font-size: 12px; font-weight: 700; text-align: center; letter-spacing: 0.5px; }
    .inv-status-draft { background: #f4f5f7; color: #888; }
    .inv-status-sent { background: #eff6ff; color: #3b82f6; }
    .inv-status-paid { background: #dcfce7; color: #16a34a; }
    .inv-status-cancelled { background: #fef2f2; color: #ef4444; }
    .inv-header { padding: 32px 40px 28px; border-bottom: 1px solid #eef0f3; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
    .inv-logo { max-height: 64px; max-width: 200px; object-fit: contain; display: block; }
    .inv-logo-text { font-size: 24px; font-weight: 900; color: #1a1a2e; letter-spacing: -1px; }
    .inv-title-col { text-align: right; }
    .inv-title-col h1 { font-size: 38px; font-weight: 900; color: #1a1a2e; letter-spacing: 3px; margin: 0 0 12px 0; }
    .inv-meta-table { border-collapse: collapse; margin-left: auto; }
    .inv-meta-table td { border: 1px solid #e0e3e9; padding: 6px 14px; font-size: 12px; }
    .inv-meta-label { background: #f8f9fb; color: #777; white-space: nowrap; }
    .inv-meta-value { font-weight: 700; color: #1a1a2e; min-width: 100px; text-align: right; }
    .inv-addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 28px 40px; border-bottom: 1px solid #eef0f3; }
    .inv-addr-box { border: 1.5px solid #e0e3e9; border-radius: 8px; padding: 16px; }
    .inv-addr-label { font-size: 10px; font-weight: 800; color: #aaa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .inv-addr-name { font-size: 14px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px; }
    .inv-addr-subname { font-size: 13px; font-weight: 500; color: #666; margin-top: 1px; }
    .inv-addr-detail { font-size: 13px; color: #555; line-height: 1.65; }
    .inv-addr-detail a { color: #333; text-decoration: none; pointer-events: none; }
    .inv-table-wrap { padding: 4px 40px 28px; }
    .inv-table { width: 100%; border-collapse: collapse; }
    .inv-table thead tr { background: #1a1a2e; }
    .inv-table thead th { padding: 12px 16px; font-size: 11px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.8px; }
    .inv-table thead th:first-child { text-align: left; border-radius: 0; }
    .inv-table thead th:not(:first-child) { text-align: right; }
    .inv-table tbody tr { border-bottom: 1px solid #eef0f3; }
    .inv-table tbody tr:last-child { border-bottom: 2px solid #1a1a2e; }
    .inv-table tbody td { padding: 13px 16px; font-size: 14px; color: #333; }
    .inv-table tbody td:not(:first-child) { text-align: right; }
    .inv-totals { display: flex; justify-content: flex-end; padding: 0 40px 28px; }
    .inv-totals-inner { width: 260px; }
    .inv-totals-row { display: flex; justify-content: space-between; padding: 9px 0; font-size: 13px; border-bottom: 1px solid #eef0f3; }
    .inv-totals-row:last-child { border-bottom: none; border-top: 2px solid #1a1a2e; margin-top: 4px; padding-top: 12px; }
    .inv-totals-row:last-child span { font-size: 16px; font-weight: 900; color: #1a1a2e; }
    .inv-totals-label { color: #666; }
    .inv-totals-amount { font-weight: 600; }
    .inv-footer-notes { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 40px 32px; }
    .inv-note-box { background: #f8f9fb; border-radius: 8px; padding: 16px; }
    .inv-note-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #aaa; margin-bottom: 6px; }
    .inv-note-text { font-size: 13px; color: #555; line-height: 1.6; white-space: pre-wrap; }
    .inv-pay-section { padding: 24px 40px 36px; display: flex; flex-direction: column; align-items: center; gap: 10px; border-top: 2px solid #f0f0f5; }
    .inv-pay-hint { font-size: 12px; color: #aaa; }
    .inv-pay-btn { display: inline-flex; align-items: center; gap: 10px; background: #4f46e5; color: #fff; font-size: 16px; font-weight: 800; padding: 15px 44px; border-radius: 10px; text-decoration: none; letter-spacing: 0.3px; }
    .inv-pay-btn:hover { background: #4338ca; }
    .inv-paid-badge { display: inline-flex; align-items: center; gap: 8px; background: #dcfce7; color: #16a34a; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 10px; }
    @media(max-width:600px){
      .inv-wrap { padding: 0; }
      .inv-card { border-radius: 0; }
      .inv-header,.inv-addresses,.inv-table-wrap,.inv-totals,.inv-footer-notes,.inv-pay-section { padding-left: 20px; padding-right: 20px; }
      .inv-header { flex-direction: column; }
      .inv-title-col { text-align: left; }
      .inv-meta-table { margin-left: 0; }
      .inv-addresses,.inv-footer-notes { grid-template-columns: 1fr; }
    }
  `;

  return (
    <div className="inv-wrap">
      <style>{styles}</style>
      <div className="inv-page">
        <div className="inv-card">
          {/* Status bar — only show for non-draft */}
          {invoice.status !== "draft" && (
            <div className={`inv-status-bar inv-status-${invoice.status}`}>
              {invoice.status === "paid" && `✓ PAID${invoice.paidAt ? " · " + new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}`}
              {invoice.status === "sent" && "⏳ AWAITING PAYMENT"}
              {invoice.status === "cancelled" && "✕ CANCELLED"}
            </div>
          )}

          {/* Header */}
          <div className="inv-header">
            <div>
              {brand?.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.name} className="inv-logo" />
              ) : (
                <div className="inv-logo-text">{brand?.name ?? "—"}</div>
              )}
              {/* Pay Now button below logo */}
              {!isPaid && invoice.stripeAccountId && invoice.status !== "cancelled" && (
                <div style={{ marginTop: "14px" }}>
                  <ScrollPayButton total={Number(invoice.total).toFixed(2)} sym={sym} />
                </div>
              )}
            </div>
            <div className="inv-title-col">
              <h1>INVOICE</h1>
              <table className="inv-meta-table">
                <tbody>
                  <tr>
                    <td className="inv-meta-label">#</td>
                    <td className="inv-meta-value">{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td className="inv-meta-label">Date</td>
                    <td className="inv-meta-value">{new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                  {invoice.dueDate && (
                    <tr>
                      <td className="inv-meta-label">Due Date</td>
                      <td className="inv-meta-value">{new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Addresses */}
          <div className="inv-addresses">
            <div className="inv-addr-box">
              <div className="inv-addr-label">From</div>
              <div className="inv-addr-name">{brand?.name ?? "—"}</div>
              <div className="inv-addr-detail">
                {brand?.address && <div style={{ whiteSpace: "pre-wrap" }}>{brand.address}</div>}
                {brand?.phone && <div>{brand.phone}</div>}
                {brand?.email && <div><a href={`mailto:${brand.email}`}>{brand.email}</a></div>}
                {brand?.website && <div><a href={brand.website} target="_blank" rel="noopener noreferrer">{brand.website.replace(/^https?:\/\//, "")}</a></div>}
              </div>
            </div>
            <div className="inv-addr-box">
              <div className="inv-addr-label">Bill To</div>
              {(invoice as { clientCompany?: string | null }).clientCompany && (
                <div className="inv-addr-name">{(invoice as { clientCompany?: string | null }).clientCompany}</div>
              )}
              <div className={`inv-addr-name ${(invoice as { clientCompany?: string | null }).clientCompany ? "inv-addr-subname" : ""}`}>
                {invoice.clientName}
              </div>
              <div className="inv-addr-detail">
                {invoice.clientEmail && <div><a href={`mailto:${invoice.clientEmail}`}>{invoice.clientEmail}</a></div>}
                {invoice.clientPhone && <div>{invoice.clientPhone}</div>}
                {invoice.clientAddress && <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{invoice.clientAddress}</div>}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ width: "80px" }}>Quantity</th>
                  <th style={{ width: "110px" }}>Rate</th>
                  <th style={{ width: "110px" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{sym}{Number(item.unitPrice).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>{sym}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="inv-totals">
            <div className="inv-totals-inner">
              <div className="inv-totals-row">
                <span className="inv-totals-label">Subtotal</span>
                <span className="inv-totals-amount">{sym}{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="inv-totals-row">
                  <span className="inv-totals-label">Discount</span>
                  <span className="inv-totals-amount" style={{ color: "#ef4444" }}>-{sym}{Number(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {invoice.taxPercent && Number(invoice.taxPercent) > 0 && (
                <div className="inv-totals-row">
                  <span className="inv-totals-label">Tax ({Number(invoice.taxPercent)}%)</span>
                  <span className="inv-totals-amount">{sym}{Number(invoice.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="inv-totals-row">
                <span>Total</span>
                <span>{sym}{Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes / Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="inv-footer-notes">
              {invoice.notes && (
                <div className="inv-note-box">
                  <div className="inv-note-label">Notes</div>
                  <div className="inv-note-text">{invoice.notes}</div>
                </div>
              )}
              {invoice.terms && (
                <div className="inv-note-box">
                  <div className="inv-note-label">Terms</div>
                  <div className="inv-note-text">{invoice.terms}</div>
                </div>
              )}
            </div>
          )}

          {/* Pay / Paid section */}
          {isPaid ? (
            <div id="pay-section" className="inv-pay-section">
              <div className="inv-paid-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Payment Received — Thank you!
              </div>
            </div>
          ) : invoice.stripeAccountId && invoice.status !== "cancelled" ? (
            <div id="pay-section" className="inv-pay-section">
              <EmbeddedCheckoutButton
                invoiceId={invoice.id}
                total={Number(invoice.total).toFixed(2)}
                sym={sym}
                currency={invoice.currency}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
