"use client";

import { useTransition, useState } from "react";
import { triggerSync } from "@/app/actions/sync";

export default function SyncButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSync() {
    startTransition(async () => {
      await triggerSync();
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  }

  return (
    <button
      onClick={handleSync}
      disabled={pending}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60 ${
        done
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
      }`}
    >
      {pending ? (
        <>
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Syncing…
        </>
      ) : done ? (
        <>✓ Synced</>
      ) : (
        <>🔄 Sync Now</>
      )}
    </button>
  );
}
