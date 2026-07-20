"use client";

import { useState } from "react";
import { startEnrollment, deleteFingerprint, reEnrollFingerprint, confirmEnrollment } from "@/app/actions/zkteco";

export function EnrollFingerprintButton({
  employeeId,
  dbId,
  enrolled,
}: {
  employeeId: string;
  dbId: number;
  enrolled: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "waiting" | "confirming" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const spinner = (
    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );

  async function handleEnroll() {
    setStatus("loading");
    setMessage("");
    const result = await startEnrollment(employeeId);
    if ("error" in result) {
      setStatus("error");
      setMessage("Could not connect to the fingerprint machine. Make sure you are on the office network.");
    } else {
      setStatus("waiting");
    }
  }

  async function handleReEnroll() {
    setStatus("loading");
    setMessage("");
    const result = await reEnrollFingerprint(employeeId);
    if ("error" in result) {
      setStatus("error");
      setMessage("Could not connect to fingerprint machine.");
    } else {
      setStatus("waiting");
    }
  }

  async function handleConfirm() {
    setStatus("confirming");
    setMessage("");
    const result = await confirmEnrollment(employeeId, dbId);
    if ("error" in result) {
      setStatus("error");
      setMessage(result.error);
    } else {
      setStatus("success");
      setMessage("Fingerprint enrolled successfully.");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete fingerprint for this employee? They will need to re-enroll.")) return;
    setStatus("loading");
    setMessage("");
    const result = await deleteFingerprint(employeeId, dbId);
    if ("error" in result) {
      setStatus("error");
      setMessage(result.error);
    } else {
      setStatus("idle");
      setMessage("");
    }
  }

  if (status === "waiting") {
    return (
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Machine ready — place finger on device 3 times, then confirm
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Confirm Enrollment
          </button>
          <button
            type="button"
            onClick={() => { setStatus("idle"); setMessage(""); }}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (enrolled) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReEnroll}
            disabled={status === "loading" || status === "confirming"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
          >
            {status === "loading" ? spinner : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {status === "loading" ? "Connecting..." : "Re-enroll"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={status === "loading" || status === "confirming"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"
          >
            {status === "loading" ? spinner : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            {status === "loading" ? "..." : "Delete Finger"}
          </button>
        </div>
        {status === "success" && <p className="text-xs text-emerald-600">{message}</p>}
        {status === "error" && <p className="text-xs text-red-500">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleEnroll}
        disabled={status === "loading"}
        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-opacity btn-brand"
      >
        {status === "loading" ? spinner : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        )}
        {status === "loading" ? "Connecting..." : "Enroll Fingerprint"}
      </button>
      {status === "error" && <p className="text-xs text-red-500">{message}</p>}
    </div>
  );
}
