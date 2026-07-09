"use client";

import { useState, useTransition } from "react";
import { switchStripeMode, deleteStripeAccount } from "@/app/actions/invoices";

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
                ? "bg-amber-500 text-white shadow-sm"
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
                ? "bg-green-600 text-white shadow-sm"
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
        <div className={`rounded-lg border p-3 ${hasTest ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-zinc-50"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${hasTest ? "bg-amber-400" : "bg-zinc-300"}`} />
              <span className="text-xs font-semibold text-zinc-600">Test Keys</span>
            </div>
            <span className={`text-[10px] font-bold ${hasTest ? "text-amber-600" : "text-zinc-400"}`}>
              {hasTest ? "✓ Added" : "Missing"}
            </span>
          </div>
          <button
            onClick={() => setEditMode(editMode === "test" ? null : "test")}
            className="text-[11px] text-indigo-600 hover:underline"
          >
            {hasTest ? "Update keys" : "+ Add test keys"}
          </button>
        </div>

        {/* Live keys */}
        <div className={`rounded-lg border p-3 ${hasLive ? "border-green-200 bg-green-50" : "border-zinc-200 bg-zinc-50"}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${hasLive ? "bg-green-400" : "bg-zinc-300"}`} />
              <span className="text-xs font-semibold text-zinc-600">Live Keys</span>
            </div>
            <span className={`text-[10px] font-bold ${hasLive ? "text-green-600" : "text-zinc-400"}`}>
              {hasLive ? "✓ Added" : "Missing"}
            </span>
          </div>
          <button
            onClick={() => setEditMode(editMode === "live" ? null : "live")}
            className="text-[11px] text-indigo-600 hover:underline"
          >
            {hasLive ? "Update keys" : "+ Add live keys"}
          </button>
        </div>
      </div>

      {/* Inline key editor */}
      {editMode && (
        <form onSubmit={handleSaveKeys} className={`mt-3 rounded-lg border p-3 flex flex-col gap-2 ${editMode === "test" ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
          <p className="text-xs font-semibold text-zinc-600">
            {editMode === "test" ? "🟡 Test Keys" : "🟢 Live Keys"}
          </p>
          <input
            name="secretKey"
            type="password"
            required
            placeholder={editMode === "test" ? "sk_test_..." : "sk_live_..."}
            className="rounded border border-zinc-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
          />
          <input
            name="publishableKey"
            required
            placeholder={editMode === "test" ? "pk_test_..." : "pk_live_..."}
            className="rounded border border-zinc-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
          />
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
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
