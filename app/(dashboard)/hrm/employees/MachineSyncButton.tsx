"use client";

import { useState } from "react";
import { syncZKAttendance } from "@/app/actions/zkteco";
import { useRouter } from "next/navigation";

type LastSync = { syncedAt: Date; source: string; enrolled: number } | null;

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function MachineSyncButton({ lastSync }: { lastSync: LastSync }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await syncZKAttendance();
      if ("synced" in res) {
        setResult(`✓ ${res.synced} synced`);
        router.refresh();
      } else {
        setResult("✗ Failed");
      }
    } catch {
      setResult("✗ Connection failed");
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
        {loading ? "Syncing..." : "Sync Attendance"}
      </button>

      <div className="flex flex-col leading-tight">
        {result && (
          <span className={`text-xs font-medium ${result.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
            {result}
          </span>
        )}
        {!result && lastSync && (
          <span className="text-xs text-zinc-400">
            Finger sync: {timeAgo(lastSync.syncedAt)}
            {lastSync.source === "python" && (
              <span className="ml-1 text-emerald-500 font-medium">✓</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
