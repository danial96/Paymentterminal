"use client";

import { useState, useRef } from "react";
import { upsertMonthlyTarget } from "@/app/actions/sellers";

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

export default function SellerTargetCell({
  sellerName,
  month,
  target,
  targetPct,
  amountPaid,
  isFrontSeller,
  isUpseller,
  isAdmin,
}: {
  sellerName: string;
  month: string;
  target: number | null;
  targetPct: number | null;
  amountPaid: number;
  isFrontSeller: boolean;
  isUpseller: boolean;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const upsellRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setSaving(true);
    const frontVal = isFrontSeller && frontRef.current?.value ? parseFloat(frontRef.current.value) : null;
    const upsellVal = isUpseller && upsellRef.current?.value ? parseFloat(upsellRef.current.value) : null;
    await upsertMonthlyTarget(sellerName, month, frontVal, upsellVal);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[180px]">
        {isFrontSeller && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 w-12">Front</span>
            <input
              ref={frontRef}
              type="number"
              min="0"
              step="1"
              placeholder="£"
              className="w-20 rounded border border-zinc-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
        )}
        {isUpseller && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 w-12">Upsell</span>
            <input
              ref={upsellRef}
              type="number"
              min="0"
              step="1"
              placeholder="£"
              className="w-20 rounded border border-zinc-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>
        )}
        <div className="flex gap-1.5 mt-0.5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? <Spinner /> : null} Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const pctColor =
    targetPct !== null && targetPct >= 100
      ? "text-emerald-600"
      : targetPct !== null && targetPct >= 70
      ? "text-amber-600"
      : "text-zinc-400";

  const barColor =
    targetPct !== null && targetPct >= 100
      ? "bg-emerald-500"
      : targetPct !== null && targetPct >= 70
      ? "bg-amber-400"
      : "bg-zinc-400";

  return (
    <div className="flex items-center gap-2 group/cell">
      <div className="flex flex-col gap-1 flex-1">
        {target !== null ? (
          <>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-emerald-700">£{amountPaid.toFixed(0)}</span>
              <span className="text-zinc-400">/ £{target.toFixed(0)}</span>
              <span className={`font-semibold ${pctColor}`}>
                {targetPct !== null ? `${targetPct}%` : "0%"}
              </span>
            </div>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(targetPct ?? 0, 100)}%` }}
              />
            </div>
          </>
        ) : (
          <span className="text-xs text-zinc-300">No target</span>
        )}
      </div>
      {isAdmin && (
        saved ? (
          <span className="text-[10px] text-emerald-600 font-semibold">✓ Saved</span>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            title="Edit target"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
            </svg>
            Edit
          </button>
        )
      )}
    </div>
  );
}
