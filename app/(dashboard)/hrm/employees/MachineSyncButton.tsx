"use client";

import { useState } from "react";
import { syncFingerprintStatus } from "@/app/actions/zkteco";
import { useRouter } from "next/navigation";

export function MachineSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await syncFingerprintStatus();
      if (res.success) {
        setResult(`✓ Synced — ${res.enrolled} enrolled, ${res.notEnrolled} not enrolled`);
        router.refresh();
      } else {
        setResult(`Error: ${res.error}`);
      }
    } catch (e: unknown) {
      setResult("Connection failed");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
      >
        <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {loading ? "Syncing..." : "Sync Machine"}
      </button>
      {result && (
        <span className={`text-xs ${result.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
