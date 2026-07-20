"use client";

import { useTransition } from "react";
import { switchStripeMode } from "@/app/actions/invoices";

export default function StripeModeSwitcher({
  accountId,
  currentMode,
  hasTest,
  hasLive,
}: {
  accountId: number;
  currentMode: "test" | "live";
  hasTest: boolean;
  hasLive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function switchTo(mode: "test" | "live") {
    startTransition(() => switchStripeMode(accountId, mode));
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 w-fit">
      <button
        onClick={() => switchTo("test")}
        disabled={isPending || !hasTest}
        title={!hasTest ? "Add test keys first" : undefined}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40 ${
          currentMode === "test"
            ? "bg-zinc-500 text-white shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${currentMode === "test" ? "bg-white" : "bg-zinc-400"}`} />
        Test Mode
      </button>
      <button
        onClick={() => switchTo("live")}
        disabled={isPending || !hasLive}
        title={!hasLive ? "Add live keys first" : undefined}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40 ${
          currentMode === "live"
            ? "bg-zinc-900 text-white shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${currentMode === "live" ? "bg-white animate-pulse" : "bg-zinc-400"}`} />
        Live Mode
      </button>
    </div>
  );
}
