"use client";

import { useState, useTransition } from "react";
import { toggleSellerActive, toggleSellerRole, upsertSellerProfile, deleteSellerProfile } from "@/app/actions/sellers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

type SellerRow = {
  name: string;
  isActive: boolean;
  isFrontSeller: boolean;
  isUpseller: boolean;
  frontTarget: number | null;
  upsellTarget: number | null;
};

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

function ToggleBtn({
  on,
  pending,
  color,
  onClick,
}: {
  on: boolean;
  pending: boolean;
  color: "zinc" | "blue" | "purple";
  onClick: () => void;
}) {
  const track = {
    zinc: on ? "bg-zinc-900" : "bg-zinc-200",
    blue: on ? "bg-zinc-900" : "bg-zinc-200",
    purple: on ? "bg-zinc-700" : "bg-zinc-200",
  }[color];

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${track}`}
      >
        {pending ? (
          <span className="mx-auto text-white"><Spinner /></span>
        ) : (
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
        )}
      </button>
      <span className={`text-[10px] font-semibold ${on ? "text-zinc-700" : "text-zinc-400"}`}>
        {pending ? "..." : on ? "Yes" : "No"}
      </span>
    </div>
  );
}

function buildTargets(rows: SellerRow[]) {
  const init: Record<string, { front: string; upsell: string }> = {};
  for (const r of rows) {
    init[r.name] = {
      front: r.frontTarget != null ? String(r.frontTarget) : "",
      upsell: r.upsellTarget != null ? String(r.upsellTarget) : "",
    };
  }
  return init;
}

export default function ManageSellersTable({ initialRows }: { initialRows: SellerRow[] }) {
  const [targets, setTargets] = useState<Record<string, { front: string; upsell: string }>>(() =>
    buildTargets(initialRows)
  );

  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set());
  const [togglePending, setTogglePending] = useState<string | null>(null);
  const [rows, setRows] = useState<SellerRow[]>(initialRows);
  const [deletingRow, setDeletingRow] = useState<string | null>(null);

  function markSaved(name: string) {
    setSavedRows((prev) => new Set(prev).add(name));
    setTimeout(() => setSavedRows((prev) => { const s = new Set(prev); s.delete(name); return s; }), 2000);
  }

  async function saveRow(name: string) {
    if (savingRow || savingAll) return;
    setSavingRow(name);
    const fd = new FormData();
    fd.set("name", name);
    const t = targets[name];
    if (t.front) fd.set("frontTarget", t.front);
    if (t.upsell) fd.set("upsellTarget", t.upsell);
    await upsertSellerProfile(fd);
    // keep the typed values in state so they remain visible after save
    setTargets((prev) => ({ ...prev, [name]: { front: t.front, upsell: t.upsell } }));
    setSavingRow(null);
    markSaved(name);
  }

  async function saveAll() {
    if (savingAll || savingRow) return;
    setSavingAll(true);
    await Promise.all(
      rows.map((r) => {
        const fd = new FormData();
        fd.set("name", r.name);
        const t = targets[r.name];
        if (t?.front) fd.set("frontTarget", t.front);
        if (t?.upsell) fd.set("upsellTarget", t.upsell);
        return upsertSellerProfile(fd);
      })
    );
    setSavingAll(false);
    // mark all saved
    const all = new Set(rows.map((r) => r.name));
    setSavedRows(all);
    setTimeout(() => setSavedRows(new Set()), 2000);
  }

  async function handleDelete(name: string) {
    if (!confirm(`Remove "${name}" from Manage Sellers? Their sales data will not be deleted.`)) return;
    setDeletingRow(name);
    await deleteSellerProfile(name);
    setRows((prev) => prev.filter((r) => r.name !== name));
    setDeletingRow(null);
  }

  async function handleToggle(name: string, field: "isActive" | "isFrontSeller" | "isUpseller") {
    const key = `${name}:${field}`;
    if (togglePending) return;
    setTogglePending(key);

    const row = rows.find((r) => r.name === name)!;
    const newVal = !row[field];

    if (field === "isActive") {
      await toggleSellerActive(name, newVal);
    } else {
      await toggleSellerRole(name, field, newVal);
    }

    setRows((prev) => prev.map((r) => r.name === name ? { ...r, [field]: newVal } : r));
    setTogglePending(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Save All bar */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-3">
        <p className="text-sm text-zinc-500">
          Edit targets below, then save individually or all at once.
        </p>
        <button
          onClick={saveAll}
          disabled={savingAll || !!savingRow}
          className="btn-brand flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-colors"
        >
          {savingAll ? <><Spinner /> Saving all...</> : <><FontAwesomeIcon icon={faFloppyDisk} className="h-3.5 w-3.5" /> Save All</>}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <th className="border-r border-zinc-200 px-5 py-3">Seller</th>
              <th className="border-r border-zinc-200 px-5 py-3 text-center">Show</th>
              <th className="border-r border-zinc-200 px-5 py-3 text-center">Front Seller</th>
              <th className="border-r border-zinc-200 px-5 py-3 text-center">Upseller</th>
              <th className="border-r border-zinc-200 px-5 py-3 text-center">Front Target</th>
              <th className="border-r border-zinc-200 px-5 py-3 text-center">Upsell Target</th>
              <th className="border-r border-zinc-200 px-5 py-3 text-center">Save</th>
              <th className="border-r border-zinc-200 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => {
              const { name, isActive, isFrontSeller, isUpseller } = row;
              const t = targets[name] ?? { front: "", upsell: "" };
              const isSaving = savingRow === name;
              const isSaved = savedRows.has(name);

              return (
                <tr key={name} className={`transition-colors ${isSaved ? "bg-zinc-50" : "hover:bg-zinc-50"}`}>
                  {/* Seller name */}
                  <td className="border-r border-zinc-100 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isActive ? "bg-zinc-100 text-zinc-600" : "bg-zinc-100 text-zinc-400"}`}>
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className={`font-medium ${isActive ? "text-zinc-900" : "text-zinc-400"}`}>{name}</p>
                        <div className="mt-0.5 flex gap-1">
                          {isFrontSeller && <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">Front</span>}
                          {isUpseller && <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">Upsell</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Show toggle */}
                  <td className="border-r border-zinc-100 px-5 py-3.5 text-center">
                    <ToggleBtn
                      on={isActive}
                      pending={togglePending === `${name}:isActive`}
                      color="zinc"
                      onClick={() => handleToggle(name, "isActive")}
                    />
                  </td>

                  {/* Front Seller toggle */}
                  <td className="border-r border-zinc-100 px-5 py-3.5 text-center">
                    <ToggleBtn
                      on={isFrontSeller}
                      pending={togglePending === `${name}:isFrontSeller`}
                      color="blue"
                      onClick={() => handleToggle(name, "isFrontSeller")}
                    />
                  </td>

                  {/* Upseller toggle */}
                  <td className="border-r border-zinc-100 px-5 py-3.5 text-center">
                    <ToggleBtn
                      on={isUpseller}
                      pending={togglePending === `${name}:isUpseller`}
                      color="purple"
                      onClick={() => handleToggle(name, "isUpseller")}
                    />
                  </td>

                  {/* Front Target input */}
                  <td className="border-r border-zinc-100 px-5 py-3.5 text-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={t.front}
                      onChange={(e) => setTargets((prev) => ({ ...prev, [name]: { ...prev[name], front: e.target.value } }))}
                      disabled={!isFrontSeller}
                      placeholder="£"
                      className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-300"
                    />
                  </td>

                  {/* Upsell Target input */}
                  <td className="border-r border-zinc-100 px-5 py-3.5 text-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={t.upsell}
                      onChange={(e) => setTargets((prev) => ({ ...prev, [name]: { ...prev[name], upsell: e.target.value } }))}
                      disabled={!isUpseller}
                      placeholder="£"
                      className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-300"
                    />
                  </td>

                  {/* Individual save */}
                  <td className="border-r border-zinc-100 px-5 py-3.5 text-center">
                    {isSaved ? (
                      <span className="text-xs font-semibold text-zinc-700"><FontAwesomeIcon icon={faCheck} className="mr-0.5 h-3 w-3" />Saved</span>
                    ) : (
                      <button
                        onClick={() => saveRow(name)}
                        disabled={isSaving || savingAll}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                      >
                        {isSaving ? <><Spinner /> Saving</> : "Save"}
                      </button>
                    )}
                  </td>

                  {/* Delete */}
                  <td className="border-r border-zinc-100 px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleDelete(name)}
                      disabled={deletingRow === name}
                      className="text-zinc-300 hover:text-red-500 disabled:opacity-50 transition-colors"
                      title="Remove seller profile"
                    >
                      {deletingRow === name ? <Spinner /> : <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
