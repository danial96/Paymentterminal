"use client";

import { useState, useTransition } from "react";
import { updateInvoiceStatus, deleteInvoice } from "@/app/actions/invoices";

export default function InvoiceActions({
  invoiceId,
  invoiceNumber,
  status,
  isAdmin,
}: {
  invoiceId: number;
  invoiceNumber: string;
  status: string;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"public" | null>(null);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/invoice/${invoiceNumber}`
    : `/invoice/${invoiceNumber}`;

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied("public");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Public Invoice Link — always available */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-800 mb-1 flex items-center gap-2">
          <svg className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Shareable Invoice Page
        </h3>
        <p className="text-[11px] text-zinc-400 mb-3">Client can view invoice + pay online</p>
        <div className="flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 mb-2">
          <span className="text-xs text-violet-700 truncate flex-1 font-mono">/invoice/{invoiceNumber}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => copyLink()}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${copied === "public" ? "border-green-300 bg-green-50 text-green-700" : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"}`}>
            {copied === "public" ? (
              <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
            ) : (
              <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Link</>
            )}
          </button>
          <a href={`/invoice/${invoiceNumber}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Preview
          </a>
        </div>
        <button
          onClick={() => {
            const w = window.open(`/invoice/${invoiceNumber}?preview=1`, "_blank", "width=900,height=750,scrollbars=yes");
            if (w) {
              w.addEventListener("load", () => {
                const orig = w.document.title;
                w.document.title = invoiceNumber;
                setTimeout(() => { w.print(); w.document.title = orig; }, 300);
              });
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors mt-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
          Download Invoice
        </button>
      </div>

      {/* Status actions */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-800 mb-3">Update Status</h3>
        <div className="flex flex-col gap-2">
          {status !== "paid" && (
            <button
              onClick={() => startTransition(() => updateInvoiceStatus(invoiceId, "paid"))}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Mark as Paid
            </button>
          )}
          {status === "paid" && isAdmin && (
            <button
              onClick={() => { if (confirm("Mark this invoice as unpaid? This will revert it to Sent status.")) startTransition(() => updateInvoiceStatus(invoiceId, "sent")); }}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              Mark as Unpaid
            </button>
          )}
          {status === "draft" && (
            <button
              onClick={() => startTransition(() => updateInvoiceStatus(invoiceId, "sent"))}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              Mark as Sent
            </button>
          )}
          {status !== "cancelled" && status !== "paid" && (
            <button
              onClick={() => startTransition(() => updateInvoiceStatus(invoiceId, "cancelled"))}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-60 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel Invoice
            </button>
          )}
          <form action={deleteInvoice.bind(null, invoiceId)} onSubmit={(e) => { if (!confirm("Delete this invoice?")) e.preventDefault(); }}>
            <button className="flex w-full items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete Invoice
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
