"use client";

import { useTransition, useState } from "react";
import { triggerSync } from "@/app/actions/sync";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faRotate } from "@fortawesome/free-solid-svg-icons";

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
          ? "bg-zinc-200 text-zinc-700"
          : "bg-zinc-200/60 text-zinc-500 hover:bg-zinc-200"
      }`}
    >
      {pending ? (
        <>
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Syncing…
        </>
      ) : done ? (
        <><FontAwesomeIcon icon={faCheck} className="h-3 w-3" /> Synced</>
      ) : (
        <><FontAwesomeIcon icon={faRotate} className="h-3 w-3" /> Sync Now</>
      )}
    </button>
  );
}
