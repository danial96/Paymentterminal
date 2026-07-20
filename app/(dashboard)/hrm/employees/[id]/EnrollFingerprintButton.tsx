"use client";

import { useState } from "react";
import { startEnrollment } from "@/app/actions/zkteco";

export function EnrollFingerprintButton({ employeeId, enrolled }: { employeeId: string; enrolled: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (enrolled) return null;

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

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleEnroll}
        disabled={status === "loading"}
        className="rounded-lg bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
      >
        {status === "loading" ? "Connecting..." : "🖐 Enroll Fingerprint"}
      </button>
      {status === "success" && (
        <p className="text-xs text-green-600 font-medium">{message}</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-500">{message}</p>
      )}
    </div>
  );
}
