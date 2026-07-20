"use client";

import { useState } from "react";
import { startEnrollment, deleteFingerprint, reEnrollFingerprint } from "@/app/actions/zkteco";

export function EnrollFingerprintButton({
  employeeId,
  dbId,
  enrolled,
}: {
  employeeId: string;
  dbId: number;
  enrolled: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleEnroll() {
    setStatus("loading");
    setMessage("");
    const result = await startEnrollment(employeeId);
    if ("error" in result) {
      setStatus("error");
      setMessage("Could not connect to the fingerprint machine. Make sure you are on the office network.");
    } else {
      setStatus("success");
      setMessage("Machine is ready! Ask the employee to place their finger on the device.");
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
      setStatus("success");
      setMessage("Machine is ready! Ask employee to place their finger.");
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
      setStatus("success");
      setMessage("Fingerprint deleted. Employee can re-enroll now.");
    }
  }

  const spinner = (
    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );

  if (enrolled) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReEnroll}
            disabled={status === "loading"}
            className="rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            {status === "loading" ? spinner : "🔄"}
            {status === "loading" ? "Connecting..." : "Re-enroll Finger"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={status === "loading"}
            className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            {status === "loading" ? spinner : "🗑"}
            {status === "loading" ? "..." : "Delete Finger"}
          </button>
        </div>
        {status === "success" && <p className="text-xs text-green-600 font-medium">{message}</p>}
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
        className="rounded-lg bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"
      >
        {status === "loading" ? spinner : "🖐"}
        {status === "loading" ? "Connecting..." : "Enroll Fingerprint"}
      </button>
      {status === "success" && <p className="text-xs text-green-600 font-medium">{message}</p>}
      {status === "error" && <p className="text-xs text-red-500">{message}</p>}
    </div>
  );
}
