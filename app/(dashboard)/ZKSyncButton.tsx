"use client";

import { useState } from "react";
import { syncZKAttendance } from "@/app/actions/zkteco";

export default function ZKSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ synced: number; skipped: number; errors: string[] } | null>(null);
  const [showResult, setShowResult] = useState(false);

  async function handleSync() {
    setLoading(true);
    setShowResult(false);
    try {
      const res = await syncZKAttendance();
      setResult(res);
      setShowResult(true);
      setTimeout(() => setShowResult(false), 5000);
    } catch {
      setResult({ synced: 0, skipped: 0, errors: ["Could not connect to fingerprint machine."] });
      setShowResult(true);
      setTimeout(() => setShowResult(false), 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        title="Sync ZKTeco attendance"
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 transition-all"
        style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
      >
        <svg
          className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {loading ? "Syncing..." : "ZK Sync"}
      </button>

      {showResult && result && (
        <div className={`absolute right-0 top-full mt-2 z-50 rounded-lg shadow-lg border px-3 py-2 text-xs whitespace-nowrap ${
          result.errors.length > 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {result.errors.length > 0
            ? result.errors[0]
            : `✓ Synced ${result.synced} · Skipped ${result.skipped}`}
        </div>
      )}
    </div>
  );
}
