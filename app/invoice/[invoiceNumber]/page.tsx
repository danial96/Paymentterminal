import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmbeddedCheckoutButton from "./EmbeddedCheckout";
import ScrollPayButton from "./ScrollPayButton";
import PrintButton from "./PrintButton";

const CURRENCY_SYMBOLS: Record<string, string> = { gbp: "£", usd: "$", eur: "€", pkr: "₨" };

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const l = (v: number) => Math.min(255, Math.round(v + (255 - v) * amount));
  return `rgb(${l(r)},${l(g)},${l(b)})`;
}

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceNumber: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { invoiceNumber } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  const invoice = await prisma.invoice.findUnique({ where: { invoiceNumber } });
  if (!invoice) notFound();

  const brand = invoice.brandId
    ? await prisma.brand.findUnique({ where: { id: invoice.brandId } })
    : null;

  const items = invoice.items as { description: string; quantity: number; unitPrice: number }[];
  const sym = CURRENCY_SYMBOLS[invoice.currency] ?? "£";
  const isPaid = invoice.status === "paid";

  const accent = (brand as { brandColor?: string | null })?.brandColor ?? "#1a1a2e";
  const accentLight = lighten(accent, 0.92);
  const accentMid = lighten(accent, 0.7);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${isPreview ? "#fff" : "#e8eaed"}; }
    .inv-wrap { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: ${isPreview ? "#fff" : "#e8eaed"}; min-height: 100vh; padding: ${isPreview ? "0" : "40px 16px 80px"}; color: #111; }
    .inv-page { max-width: 840px; margin: 0 auto; }
    .inv-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.07); overflow: hidden; border-top: 4px solid ${accent}; position: relative; }
    .inv-paid-stamp { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 88px; font-weight: 900; color: rgba(22, 163, 74, 0.12); border: 8px solid rgba(22, 163, 74, 0.12); border-radius: 12px; padding: 4px 28px; letter-spacing: 12px; text-transform: uppercase; pointer-events: none; user-select: none; white-space: nowrap; z-index: 10; }

    /* HEADER */
    .inv-header { padding: 32px 44px 28px; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; border-bottom: 1px solid #f0f1f4; }
    .inv-header-logo { max-height: 58px; max-width: 200px; object-fit: contain; display: block; }
    .inv-header-logo-text { font-size: 22px; font-weight: 900; color: #1e2330; letter-spacing: -0.5px; }
    .inv-header-right { text-align: right; }
    .inv-header-title { font-size: 36px; font-weight: 900; color: #1e2330; letter-spacing: 6px; line-height: 1; }
    .inv-header-num { font-size: 13px; color: #999; margin-top: 8px; font-weight: 500; }
    .inv-header-accent-bar { display: block; width: 40px; height: 3px; background: ${accent}; border-radius: 2px; margin: 8px 0 0 auto; }

    /* STATUS */
    .inv-status-strip { padding: 7px 44px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; text-align: center; }
    .inv-status-sent { background: #eff6ff; color: #3b82f6; }
    .inv-status-paid { background: #dcfce7; color: #16a34a; }
    .inv-status-cancelled { background: #fef2f2; color: #ef4444; }
    .inv-status-draft { background: #f5f6f8; color: #9ca3af; }

    /* META */
    .inv-meta-row { display: flex; background: #f8f9fb; border-bottom: 1px solid #eef0f3; }
    .inv-meta-cell { flex: 1; padding: 13px 44px; border-right: 1px solid #eef0f3; }
    .inv-meta-cell:last-child { border-right: none; }
    .inv-meta-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #aaa; margin-bottom: 3px; }
    .inv-meta-val { font-size: 13px; font-weight: 700; color: #1e2330; }

    /* ADDRESSES */
    .inv-addresses { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #f0f1f4; }
    .inv-addr-box { padding: 24px 44px; }
    .inv-addr-box:first-child { border-right: 1px solid #f0f1f4; }
    .inv-addr-lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #aaa; margin-bottom: 10px; }
    .inv-addr-name { font-size: 15px; font-weight: 800; color: #1e2330; line-height: 1.3; }
    .inv-addr-sub { font-size: 13px; font-weight: 500; color: #666; margin-top: 2px; }
    .inv-addr-detail { font-size: 12.5px; color: #888; line-height: 1.85; margin-top: 7px; }
    .inv-addr-detail a { color: #888; text-decoration: none; pointer-events: none; }

    /* TABLE */
    .inv-table-wrap { padding: 28px 44px 0; }
    .inv-table { width: 100%; border-collapse: collapse; }
    .inv-table thead tr { border-bottom: 2px solid ${accent}; }
    .inv-table thead th { padding: 9px 12px; font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 1px; background: #fff; }
    .inv-table thead th:first-child { text-align: left; padding-left: 0; }
    .inv-table thead th:not(:first-child) { text-align: right; }
    .inv-table tbody tr { border-bottom: 1px solid #f3f4f6; }
    .inv-table tbody tr:last-child { border-bottom: none; }
    .inv-table tbody td { padding: 13px 12px; font-size: 13.5px; color: #444; }
    .inv-table tbody td:first-child { padding-left: 0; color: #1e2330; }
    .inv-table tbody td:not(:first-child) { text-align: right; }
    .inv-table tbody td:last-child { font-weight: 700; color: #1e2330; }

    /* TOTALS */
    .inv-totals-wrap { display: flex; justify-content: flex-end; padding: 20px 44px 28px; }
    .inv-totals-box { width: 260px; }
    .inv-totals-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; font-size: 13px; border-bottom: 1px solid #f0f1f4; }
    .inv-totals-row:last-child { border-bottom: none; border-top: 2px solid ${accent}; margin-top: 6px; padding-top: 12px; }
    .inv-totals-row:last-child span { font-size: 16px; font-weight: 900; color: #1e2330; }
    .inv-totals-lbl { color: #999; font-weight: 500; }
    .inv-totals-amt { font-weight: 600; color: #333; }

    /* NOTES */
    .inv-notes-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 0 44px 28px; }
    .inv-note-box { background: #f8f9fb; border-radius: 8px; padding: 14px 16px; }
    .inv-note-lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #aaa; margin-bottom: 6px; }
    .inv-note-text { font-size: 12.5px; color: #666; line-height: 1.65; white-space: pre-wrap; }

    /* BANK SECTION */
    .inv-bank-section { margin: 0 44px 32px; border: 1px solid #eef0f3; border-radius: 10px; overflow: hidden; }
    .inv-bank-header { background: #f8f9fb; padding: 10px 20px; border-bottom: 2px solid ${accent}; }
    .inv-bank-header-text { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #666; }
    .inv-bank-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .inv-bank-cell { padding: 14px 20px; border-bottom: 1px solid #f0f1f4; border-right: 1px solid #f0f1f4; }
    .inv-bank-cell:nth-child(even) { border-right: none; }
    .inv-bank-cell:nth-last-child(-n+2) { border-bottom: none; }
    .inv-bank-cell-full { grid-column: 1 / -1; border-right: none; }
    .inv-bank-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #bbb; margin-bottom: 4px; }
    .inv-bank-val { font-size: 13.5px; font-weight: 700; color: #1e2330; font-family: 'SF Mono', 'Fira Code', monospace; }
    .inv-bank-ref { padding: 10px 20px; background: #f8f9fb; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #f0f1f4; }
    .inv-bank-ref strong { color: #1e2330; font-weight: 700; }

    /* PAY */
    .inv-pay-section { padding: 24px 44px 36px; display: flex; flex-direction: column; align-items: center; gap: 10px; border-top: 1px solid #f0f1f4; }
    .inv-paid-badge { display: inline-flex; align-items: center; gap: 10px; background: #dcfce7; color: #16a34a; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 10px; }

    /* FOOTER */
    .inv-footer { padding: 14px 44px; background: #f8f9fb; border-top: 1px solid #eef0f3; display: flex; align-items: center; justify-content: space-between; }
    .inv-footer-brand { font-size: 11px; font-weight: 700; color: #666; }
    .inv-footer-hint { font-size: 11px; color: #bbb; }

    /* PRINT BTN */
    .inv-print-btn { position: fixed; bottom: 28px; right: 28px; display: inline-flex; align-items: center; gap: 8px; background: #1e2330; color: #fff; font-size: 14px; font-weight: 700; padding: 13px 24px; border-radius: 10px; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.18); z-index: 999; transition: opacity 0.15s; }
    .inv-print-btn:hover { opacity: 0.85; }

    @media print {
      @page { margin: 0; size: A4; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { background: #fff; }
      .inv-print-btn { display: none !important; }
      .inv-wrap { background: #fff; padding: 0; }
      .inv-card { box-shadow: none; border-radius: 0; }
    }
    @media (max-width: 600px) {
      .inv-wrap { padding: 0 0 80px; }
      .inv-card { border-radius: 0; }
      .inv-header { padding: 20px; flex-direction: column; }
      .inv-header-right { text-align: left; }
      .inv-header-accent-bar { margin: 8px 0 0 0; }
      .inv-meta-row { flex-wrap: wrap; }
      .inv-meta-cell { flex: 0 0 50%; padding: 10px 20px; }
      .inv-addresses { grid-template-columns: 1fr; }
      .inv-addr-box { padding: 18px 20px; }
      .inv-addr-box:first-child { border-right: none; border-bottom: 1px solid #f0f1f4; }
      .inv-table-wrap { padding: 20px 20px 0; }
      .inv-totals-wrap { padding: 16px 20px 20px; }
      .inv-totals-box { width: 100%; }
      .inv-notes-wrap { grid-template-columns: 1fr; padding: 0 20px 20px; }
      .inv-bank-section { margin: 0 20px 24px; }
      .inv-bank-grid { grid-template-columns: 1fr; }
      .inv-bank-cell { border-right: none !important; }
      .inv-pay-section { padding: 20px; }
      .inv-footer { padding: 12px 20px; }
    }
  `;

  const inv = invoice as typeof invoice & {
    paymentMethod?: string;
    showBankName?: boolean;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankSortCode?: string | null;
    bankIban?: string | null;
    bankSwift?: string | null;
    clientCompany?: string | null;
  };

  return (
    <div className="inv-wrap">
      <style>{styles}</style>
      <div className="inv-page">
        <div className="inv-card">

          {/* PAID STAMP */}
          {isPaid && <div className="inv-paid-stamp">PAID</div>}

          {/* HEADER */}
          <div className="inv-header">
            <div>
              {brand?.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.name} className="inv-header-logo" />
              ) : (
                <div className="inv-header-logo-text">{brand?.name ?? "—"}</div>
              )}
            </div>
            <div className="inv-header-right">
              <div className="inv-header-title">INVOICE</div>
              <div className="inv-header-num">{invoice.invoiceNumber}</div>
              <span className="inv-header-accent-bar"></span>
            </div>
          </div>

          {/* STATUS STRIP */}
          {invoice.status !== "draft" && (
            <div className={`inv-status-strip inv-status-${invoice.status}`}>
              {invoice.status === "paid" && `✓ PAID${invoice.paidAt ? "  ·  " + new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}`}
              {invoice.status === "sent" && "⏳  AWAITING PAYMENT"}
              {invoice.status === "cancelled" && "✕  CANCELLED"}
            </div>
          )}

          {/* META ROW */}
          <div className="inv-meta-row">
            <div className="inv-meta-cell">
              <div className="inv-meta-lbl">Invoice Date</div>
              <div className="inv-meta-val">{new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
            {invoice.dueDate && (
              <div className="inv-meta-cell">
                <div className="inv-meta-lbl">Due Date</div>
                <div className="inv-meta-val">{new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
              </div>
            )}
            <div className="inv-meta-cell">
              <div className="inv-meta-lbl">Total Due</div>
              <div className="inv-meta-val">{sym}{Number(invoice.total).toFixed(2)}</div>
            </div>
            <div className="inv-meta-cell">
              <div className="inv-meta-lbl">Currency</div>
              <div className="inv-meta-val">{invoice.currency.toUpperCase()}</div>
            </div>
          </div>

          {/* ADDRESSES */}
          <div className="inv-addresses">
            <div className="inv-addr-box">
              <div className="inv-addr-lbl">From</div>
              <div className="inv-addr-name">{brand?.name ?? "—"}</div>
              <div className="inv-addr-detail">
                {brand?.address && <div style={{ whiteSpace: "pre-wrap" }}>{brand.address}</div>}
                {brand?.phone && <div>{brand.phone}</div>}
                {brand?.email && <div><a href={`mailto:${brand.email}`}>{brand.email}</a></div>}
                {brand?.website && <div><a href={brand.website}>{brand.website.replace(/^https?:\/\//, "")}</a></div>}
              </div>
            </div>
            <div className="inv-addr-box">
              <div className="inv-addr-lbl">Bill To</div>
              {inv.clientCompany && <div className="inv-addr-name">{inv.clientCompany}</div>}
              <div className={inv.clientCompany ? "inv-addr-sub" : "inv-addr-name"}>{invoice.clientName}</div>
              <div className="inv-addr-detail">
                {invoice.clientEmail && <div><a href={`mailto:${invoice.clientEmail}`}>{invoice.clientEmail}</a></div>}
                {invoice.clientPhone && <div>{invoice.clientPhone}</div>}
                {invoice.clientAddress && <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{invoice.clientAddress}</div>}
              </div>
            </div>
          </div>

          {/* Stripe pay now (above table) */}
          {!isPaid && invoice.stripeAccountId && invoice.status !== "cancelled" && (
            <div style={{ padding: "0 44px 4px", display: "flex", justifyContent: "flex-end" }}>
              <ScrollPayButton total={Number(invoice.total).toFixed(2)} sym={sym} />
            </div>
          )}

          {/* LINE ITEMS */}
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ width: "80px" }}>Qty</th>
                  <th style={{ width: "120px" }}>Rate</th>
                  <th style={{ width: "120px" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td style={{ textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>{sym}{Number(item.unitPrice).toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>{sym}{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}
          <div className="inv-totals-wrap">
            <div className="inv-totals-box">
              <div className="inv-totals-row">
                <span className="inv-totals-lbl">Subtotal</span>
                <span className="inv-totals-amt">{sym}{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="inv-totals-row">
                  <span className="inv-totals-lbl">Discount</span>
                  <span className="inv-totals-amt" style={{ color: "#ef4444" }}>−{sym}{Number(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {invoice.taxPercent && Number(invoice.taxPercent) > 0 && (
                <div className="inv-totals-row">
                  <span className="inv-totals-lbl">Tax ({Number(invoice.taxPercent)}%)</span>
                  <span className="inv-totals-amt">{sym}{Number(invoice.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="inv-totals-row">
                <span>Total</span>
                <span>{sym}{Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* NOTES & TERMS */}
          {(invoice.notes || invoice.terms) && (
            <div className="inv-notes-wrap">
              {invoice.notes && (
                <div className="inv-note-box">
                  <div className="inv-note-lbl">Notes</div>
                  <div className="inv-note-text">{invoice.notes}</div>
                </div>
              )}
              {invoice.terms && (
                <div className="inv-note-box">
                  <div className="inv-note-lbl">Terms</div>
                  <div className="inv-note-text">{invoice.terms}</div>
                </div>
              )}
            </div>
          )}

          {/* PAY / PAID / BANK */}
          {isPaid ? (
            <div className="inv-pay-section">
              <div className="inv-paid-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Payment Received — Thank you!
              </div>
            </div>
          ) : inv.paymentMethod === "bank_transfer" && invoice.status !== "cancelled" ? (
            <div className="inv-bank-section">
              <div className="inv-bank-header">
                <span className="inv-bank-header-text">Bank Transfer Details</span>
              </div>
              <div className="inv-bank-grid">
                {inv.showBankName !== false && inv.bankName && (
                  <div className="inv-bank-cell">
                    <div className="inv-bank-lbl">Bank</div>
                    <div className="inv-bank-val">{inv.bankName}</div>
                  </div>
                )}
                {inv.bankAccountName && (
                  <div className="inv-bank-cell">
                    <div className="inv-bank-lbl">Account Name</div>
                    <div className="inv-bank-val">{inv.bankAccountName}</div>
                  </div>
                )}
                {inv.bankAccountNumber && (
                  <div className="inv-bank-cell">
                    <div className="inv-bank-lbl">Account Number</div>
                    <div className="inv-bank-val">{inv.bankAccountNumber}</div>
                  </div>
                )}
                {inv.bankSortCode && (
                  <div className="inv-bank-cell">
                    <div className="inv-bank-lbl">Sort Code</div>
                    <div className="inv-bank-val">{inv.bankSortCode}</div>
                  </div>
                )}
                {inv.bankIban && (
                  <div className="inv-bank-cell inv-bank-cell-full">
                    <div className="inv-bank-lbl">IBAN</div>
                    <div className="inv-bank-val">{inv.bankIban}</div>
                  </div>
                )}
                {inv.bankSwift && (
                  <div className="inv-bank-cell">
                    <div className="inv-bank-lbl">SWIFT / BIC</div>
                    <div className="inv-bank-val">{inv.bankSwift}</div>
                  </div>
                )}
              </div>
              <div className="inv-bank-ref">
                Please use <strong>{invoice.invoiceNumber}</strong> as your payment reference
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

          {/* FOOTER */}
          <div className="inv-footer">
            <span className="inv-footer-brand">{brand?.name ?? "—"}</span>
            <span className="inv-footer-hint">Thank you for your business</span>
          </div>

        </div>
      </div>
      {!isPreview && <PrintButton clientName={invoice.clientName} invoiceNumber={invoice.invoiceNumber} />}
    </div>
  );
}
