"use client";

import { useRef } from "react";
import { addService } from "@/app/actions/services";

export default function AddServiceModal({
  clientId,
  serviceTypes,
}: {
  clientId: number;
  serviceTypes: { id: number; name: string }[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Add Service / Upsell
      </button>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 m-0 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 p-0 backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Add Service / Upsell</h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="text-zinc-400 hover:text-zinc-600"
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>

        <form
          action={addService}
          onSubmit={() => dialogRef.current?.close()}
          className="grid grid-cols-2 gap-3 p-6"
        >
          <input type="hidden" name="clientId" value={clientId} />
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Service Type</label>
            <select
              name="serviceTypeId"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Total Amount (£)</label>
            <input
              type="number"
              step="0.01"
              name="totalAmount"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Sale Date</label>
            <input
              type="date"
              name="saleDate"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Duration (years, for hosting/recurring)
            </label>
            <input
              type="number"
              name="durationYears"
              min={1}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-700">Description</label>
            <input
              type="text"
              name="description"
              placeholder="e.g. Custom Combo Package for E-Commerce Website"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2 flex justify-end gap-2">
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
              Add Service
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
