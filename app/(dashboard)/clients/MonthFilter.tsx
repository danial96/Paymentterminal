"use client";

import { useEffect, useRef, useState } from "react";

function getLast24Months() {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    months.push({ value, label });
  }
  return months;
}

export default function MonthFilter({ selected }: { selected: string[] }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>(selected);
  const ref = useRef<HTMLDivElement>(null);
  const months = getLast24Months();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(val: string) {
    setChecked((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  const label =
    checked.length === 0
      ? "All Months"
      : checked.length === 1
      ? months.find((m) => m.value === checked[0])?.label ?? checked[0]
      : `${checked.length} months`;

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-zinc-500 font-medium">Month</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 min-w-[160px]"
        >
          <span>{label}</span>
          <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-52 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg">
            <label className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-zinc-50 border-b border-zinc-100">
              <input
                type="checkbox"
                checked={checked.length === 0}
                onChange={() => setChecked([])}
                className="h-3.5 w-3.5 accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">All Months</span>
            </label>
            {months.map((m) => (
              <label key={m.value} className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checked.includes(m.value)}
                  onChange={() => toggle(m.value)}
                  className="h-3.5 w-3.5 accent-zinc-900"
                />
                <span className="text-sm text-zinc-700">{m.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {/* Hidden inputs so form submit picks up selected months */}
      {checked.map((v) => (
        <input key={v} type="hidden" name="months" value={v} />
      ))}
    </div>
  );
}
