"use client";

import { useState } from "react";
import { syncZKAttendance } from "@/app/actions/zkteco";
import { useRouter } from "next/navigation";

export function FingerprintSyncButton({ enrolled }: { enrolled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (enrolled) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
        ✓ Enrolled
      </span>
    );
  }

  async function handleSync() {
    setLoading(true);
    try {
      const res = await syncZKAttendance();
      if (res.synced > 0) {
        setDone(true);
        router.refresh();
      } else {
        setDone(false);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">
        ⏳ Pending
      </span>
      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : done ? "✓" : "Sync"}
      </button>
    </div>
  );
}
