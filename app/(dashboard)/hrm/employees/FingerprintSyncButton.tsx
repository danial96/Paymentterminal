"use client";

import { useState } from "react";
import { syncZKAttendance } from "@/app/actions/zkteco";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faClock } from "@fortawesome/free-solid-svg-icons";

export function FingerprintSyncButton({ enrolled }: { enrolled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (enrolled) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-zinc-900 text-white">
        <FontAwesomeIcon icon={faCheck} className="mr-1 h-3 w-3" />Enrolled
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
      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-zinc-200 text-zinc-700">
        <FontAwesomeIcon icon={faClock} className="mr-1 h-3 w-3" />Pending
      </span>
      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : done ? <FontAwesomeIcon icon={faCheck} className="h-3 w-3" /> : "Sync"}
      </button>
    </div>
  );
}
