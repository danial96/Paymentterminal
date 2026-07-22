"use client";

import { useTransition, useState } from "react";
import { fulfillPayslipRequest, rejectPayslipRequest } from "@/app/actions/hrm-payslip-request";

export default function PayslipRequestActions({ id }: { id: number }) {
  const [note, setNote] = useState("");
  const [fulfillPending, startFulfill] = useTransition();
  const [rejectPending, startReject] = useTransition();
  const [done, setDone] = useState<"FULFILLED" | "REJECTED" | null>(null);

  if (done) {
    return (
      <span className={`text-xs font-semibold rounded-full px-3 py-1 ${done === "FULFILLED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
        {done}
      </span>
    );
  }

  function handleFulfill() {
    const fd = new FormData();
    fd.set("id", String(id));
    if (note.trim()) fd.set("hrNote", note.trim());
    startFulfill(async () => {
      await fulfillPayslipRequest(fd);
      setDone("FULFILLED");
    });
  }

  function handleReject() {
    const fd = new FormData();
    fd.set("id", String(id));
    if (note.trim()) fd.set("hrNote", note.trim());
    startReject(async () => {
      await rejectPayslipRequest(fd);
      setDone("REJECTED");
    });
  }

  return (
    <div className="mt-3 pt-3 border-t border-zinc-100 flex items-end gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-[11px] font-medium text-zinc-500 mb-1">HR Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Payslip sent via email"
          className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#29c0d5]"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleFulfill}
          disabled={fulfillPending || rejectPending}
          className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 flex items-center gap-1.5"
          style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
        >
          {fulfillPending && <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          Fulfill
        </button>
        <button
          onClick={handleReject}
          disabled={fulfillPending || rejectPending}
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 flex items-center gap-1.5"
        >
          {rejectPending && <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          Reject
        </button>
      </div>
    </div>
  );
}
