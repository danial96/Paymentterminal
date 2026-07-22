"use client";

import { useTransition, useState, useRef } from "react";
import { submitProfileUpdateRequest } from "@/app/actions/hrm-profile-requests";
import { REQUESTABLE_FIELDS } from "@/app/actions/hrm-profile-fields";

export default function RequestUpdateForm() {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!fd.get("fieldKey") || !fd.get("requestedValue")) return;
    startTransition(async () => {
      try {
        await submitProfileUpdateRequest(fd);
        formRef.current?.reset();
        showToast("success", "Request submitted. Awaiting HR approval.");
      } catch {
        showToast("error", "Failed to submit. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Request Info Update</h2>

      {/* Toast */}
      <div
        className={`overflow-hidden transition-all duration-300 ${toast ? "max-h-12 mb-3 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className={`rounded-lg px-3 py-2 text-xs font-medium ${
          toast?.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {toast?.msg}
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">
            Field to Update
          </label>
          <select
            name="fieldKey"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29c0d5]/40 transition-shadow"
          >
            <option value="">Select a field...</option>
            {REQUESTABLE_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">
            New Value
          </label>
          <input
            name="requestedValue"
            required
            placeholder="Enter the updated value"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29c0d5]/40 transition-shadow"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
        >
          {isPending && (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {isPending ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
