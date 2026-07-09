"use client";

import { useRef } from "react";
import { addPayment } from "@/app/actions/payments";

export default function LogPaymentModal({
  clientId,
  clientServiceId,
}: {
  clientId: number;
  clientServiceId: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
      >
        Log Payment
      </button>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 m-0 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 p-0 backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Log Payment</h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="text-zinc-400 hover:text-zinc-600"
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>

        <form
          action={addPayment}
          onSubmit={() => dialogRef.current?.close()}
          className="flex flex-col gap-3 p-6"
        >
          <input type="hidden" name="clientServiceId" value={clientServiceId} />
          <input type="hidden" name="clientId" value={clientId} />
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Amount (£)</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Date</label>
            <input
              type="date"
              name="paymentDate"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Note</label>
            <input
              type="text"
              name="note"
              placeholder="Partial / Remaining"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Add Payment
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
