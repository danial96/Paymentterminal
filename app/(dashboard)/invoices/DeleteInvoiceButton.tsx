"use client";

import { useTransition } from "react";
import { deleteInvoice } from "@/app/actions/invoices";

export default function DeleteInvoiceButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this invoice? This cannot be undone.")) return;
    startTransition(() => deleteInvoice(id));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <span className="h-3 w-3 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
      ) : (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      )}
      Delete
    </button>
  );
}
