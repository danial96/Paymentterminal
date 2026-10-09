"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faTriangleExclamation,
  faBell,
  faCircleCheck,
  faCalendarDays,
  faChevronDown,
  faXmark,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

const OVERDUE_OPTIONS = [
  { label: "1+ Year overdue", years: 1 },
  { label: "2+ Years overdue", years: 2 },
  { label: "3+ Years overdue", years: 3 },
  { label: "5+ Years overdue", years: 5 },
  { label: "10+ Years overdue", years: 10 },
];

function getCutoff(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split("T")[0];
}

export default function RenewalsFilter({
  defaultSearch, defaultStatus, defaultFrom, defaultTo, defaultDateField,
}: {
  defaultSearch?: string;
  defaultStatus?: string;
  defaultFrom?: string;
  defaultTo?: string;
  defaultDateField?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(updates: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k);
    });
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  function onSearch(e: React.ChangeEvent<HTMLInputElement>) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push({ search: e.target.value }), 350);
  }

  const activeYears = OVERDUE_OPTIONS.find(o => getCutoff(o.years) === (defaultTo ?? "") && !defaultFrom)?.years ?? 0;

  function onOverdueChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const years = Number(e.target.value);
    if (!years) { push({ to: "", from: "", status: "" }); return; }
    push({ to: getCutoff(years), from: "", status: "overdue" });
  }

  const hasFilter = !!(defaultSearch || defaultStatus || defaultFrom || defaultTo);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm">

      {/* Search */}
      <div className="relative w-44">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
        <input
          type="text"
          defaultValue={defaultSearch}
          onChange={onSearch}
          placeholder="Search client..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-7 pr-2 text-xs text-zinc-800 placeholder-zinc-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-zinc-200" />

      {/* Status pills */}
      <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
        {[
          { key: "", label: "All", icon: null },
          { key: "overdue", label: "Overdue", icon: faTriangleExclamation },
          { key: "soon", label: "Due Soon", icon: faBell },
          { key: "active", label: "Active", icon: faCircleCheck },
        ].map(({ key, label, icon }) => {
          const active = (defaultStatus ?? "") === key;
          return (
            <button
              key={key}
              onClick={() => push({ status: key })}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                active ? "bg-white text-zinc-900 shadow ring-1 ring-zinc-200" : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              {icon && <FontAwesomeIcon icon={icon} className={`h-3 w-3 ${active ? (key === "overdue" ? "text-rose-500" : key === "soon" ? "text-amber-500" : "text-emerald-500") : ""}`} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-zinc-200" />

      {/* Month range */}
      <div className="flex items-center gap-1.5">
        <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3 text-zinc-400" />
        <select
          value={defaultDateField ?? "end"}
          onChange={(e) => push({ dateField: e.target.value })}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs font-semibold text-zinc-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 cursor-pointer"
        >
          <option value="end">End Date</option>
          <option value="purchase">Purchase Date</option>
        </select>
        <input
          type="month"
          value={defaultFrom ? defaultFrom.slice(0, 7) : ""}
          onChange={(e) => push({ from: e.target.value ? e.target.value + "-01" : "" })}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
        />
        <span className="text-xs text-zinc-400">→</span>
        <input
          type="month"
          value={defaultTo ? defaultTo.slice(0, 7) : ""}
          onChange={(e) => {
            if (!e.target.value) { push({ to: "" }); return; }
            const [y, m] = e.target.value.split("-").map(Number);
            const lastDay = new Date(y, m, 0).getDate();
            push({ to: `${e.target.value}-${String(lastDay).padStart(2, "0")}` });
          }}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      {/* Quick month shortcuts */}
      <div className="flex items-center gap-1">
        {[
          { label: "This Month", months: 0 },
          { label: "3M", months: 3 },
          { label: "6M", months: 6 },
          { label: "1Y", months: 12 },
        ].map(({ label, months }) => {
          const now = new Date();
          const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
          const end = new Date(now.getFullYear(), now.getMonth() + months + 1, 0);
          const to = end.toISOString().split("T")[0];
          return (
            <button
              key={label}
              onClick={() => push({ from, to, status: "" })}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:border-cyan-300 hover:text-cyan-600 transition"
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-zinc-200" />

      {/* Overdue by years — dropdown */}
      <div className="relative">
        <FontAwesomeIcon icon={faClock} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
        <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-zinc-400" />
        <select
          value={activeYears}
          onChange={onOverdueChange}
          className="appearance-none rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-7 pr-7 text-xs font-semibold text-zinc-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 cursor-pointer"
        >
          <option value={0}>Overdue by years</option>
          {OVERDUE_OPTIONS.map(o => (
            <option key={o.years} value={o.years}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Clear */}
      {hasFilter && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
