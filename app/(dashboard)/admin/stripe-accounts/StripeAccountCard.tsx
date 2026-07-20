"use client";

import { useState, useTransition } from "react";
import { switchStripeMode, deleteStripeAccount } from "@/app/actions/invoices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircle } from "@fortawesome/free-solid-svg-icons";

async function updateKeys(accountId: number, formData: FormData) {
  const res = await fetch(`/api/admin/stripe-accounts/${accountId}/keys`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export default function StripeAccountCard({
  account,
  brandName,
}: {
  account: {
    id: number;
    name: string;
    mode: "test" | "live";
    secretKeyTest: string | null;
    publishableKeyTest: string | null;
    secretKeyLive: string | null;
    publishableKeyLive: string | null;
  };
  brandName?: string;
}) {
  const [mode, setMode] = useState<"test" | "live">(account.mode);
  const [editMode, setEditMode] = useState<"test" | "live" | null>(null);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasTest = !!(account.secretKeyTest && account.publishableKeyTest);
  const hasLive = !!(account.secretKeyLive && account.publishableKeyLive);

  async function handleSaveKeys(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.append("keyType", editMode!);
    await updateKeys(account.id, fd);
    setSaving(false);
    setEditMode(null);
    window.location.reload();
  }

  function handleSwitchMode(newMode: "test" | "live") {
    setMode(newMode);
    startTransition(() => switchStripeMode(account.id, newMode));
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-800 text-sm">{account.name}</p>
          {brandName && <p className="text-xs text-zinc-400">{brandName}</p>}
        </div>
        <form action={deleteStripeAccount.bind(null, account.id)}>
          <button className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
        </form>
      </div>

      {/* Mode Toggle */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 mr-1">Active Mode:</span>
        <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            onClick={() => handleSwitchMode("test")}
            disabled={isPending || !hasTest}
            title={!hasTest ? "Add test keys first" : "Switch to Test Mode"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === "test"
                ? "bg-zinc-500 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${mode === "test" ? "bg-white" : "bg-zinc-400"}`} />
            Test
          </button>
          <button
            onClick={() => handleSwitchMode("live")}
            disabled={isPending || !hasLive}
            title={!hasLive ? "Add live keys first" : "Switch to Live Mode"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === "live"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${mode === "live" ? "bg-white animate-pulse" : "bg-zinc-400"}`} />
            Live
          </button>
        </div>
        {isPending && <span className="text-xs text-zinc-400">Saving...</span>}
      </div>

      {/* Keys status */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {/* Test keys */}
        <div className={`rounded-lg border p-3 ${hasTest ? "border-zinc-200 bg-zinc-50" : "border-zinc-200 bg-zinc-50"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${hasTest ? "bg-zinc-400" : "bg-zinc-300"}`} />
              <span className="text-xs font-semibold text-zinc-600">Test Keys</span>
            </div>
            <span className={`text-[10px] font-bold ${hasTest ? "text-zinc-600" : "text-zinc-400"}`}>
              {hasTest ? <><FontAwesomeIcon icon={faCheck} className="mr-0.5 h-2.5 w-2.5" />Added</> : "Missing"}
            </span>
          </div>
          <button
            onClick={() => setEditMode(editMode === "test" ? null : "test")}
            className="text-[11px] text-zinc-700 hover:underline"
          >
            {hasTest ? "Update keys" : "+ Add test keys"}
          </button>
        </div>

        {/* Live keys */}
        <div className={`rounded-lg border p-3 ${hasLive ? "border-zinc-200 bg-zinc-50" : "border-zinc-200 bg-zinc-50"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${hasLive ? "bg-zinc-400" : "bg-zinc-300"}`} />
              <span className="text-xs font-semibold text-zinc-600">Live Keys</span>
            </div>
            <span className={`text-[10px] font-bold ${hasLive ? "text-zinc-700" : "text-zinc-400"}`}>
              {hasLive ? <><FontAwesomeIcon icon={faCheck} className="mr-0.5 h-2.5 w-2.5" />Added</> : "Missing"}
            </span>
          </div>
          <button
            onClick={() => setEditMode(editMode === "live" ? null : "live")}
            className="text-[11px] text-zinc-700 hover:underline"
          >
            {hasLive ? "Update keys" : "+ Add live keys"}
          </button>
        </div>
      </div>

      {/* Inline key editor */}
      {editMode && (
        <form onSubmit={handleSaveKeys} className={`mt-3 rounded-lg border p-3 flex flex-col gap-2 ${editMode === "test" ? "border-zinc-200 bg-zinc-50" : "border-zinc-200 bg-zinc-50"}`}>
          <p className="text-xs font-semibold text-zinc-600">
            {editMode === "test" ? <><FontAwesomeIcon icon={faCircle} className="mr-1 h-2.5 w-2.5 text-zinc-500" />Test Keys</> : <><FontAwesomeIcon icon={faCircle} className="mr-1 h-2.5 w-2.5 text-zinc-500" />Live Keys</>}
          </p>
          <input
            name="secretKey"
            type="password"
            required
            placeholder={editMode === "test" ? "sk_test_..." : "sk_live_..."}
            className="rounded border border-zinc-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full"
          />
          <input
            name="publishableKey"
            required
            placeholder={editMode === "test" ? "pk_test_..." : "pk_live_..."}
            className="rounded border border-zinc-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 w-full"
          />
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="btn-brand flex-1 rounded-md py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Keys"}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(null)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
