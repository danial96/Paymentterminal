"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MonthSelector({
  months,
  activeMonth,
  activeTab,
}: {
  months: string[];
  activeMonth: string;
  activeTab: string;
}) {
  const router = useRouter();

  // Group months by year
  const byYear = new Map<string, string[]>();
  for (const m of months) {
    const year = m.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(m);
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));
  const activeYear = activeMonth.slice(0, 4);
  const [selectedYear, setSelectedYear] = useState(activeYear);

  const monthsForYear = byYear.get(selectedYear) ?? [];

  const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function monthNum(key: string) {
    return Number(key.split("-")[1]);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Year tabs */}
      <div className="flex items-center gap-0 border-b border-zinc-100 px-4">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
              selectedYear === y
                ? "border-emerald-500 text-emerald-700"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Month grid — only months with data */}
      <div className="flex flex-wrap gap-2 p-3">
        {SHORT_MONTHS.map((name, idx) => {
          const key = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
          if (!monthsForYear.includes(key)) return null;
          const isActive = key === activeMonth;

          return (
            <button
              key={key}
              onClick={() => router.push(`/sellers?tab=${activeTab}&month=${key}`)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 ring-1 ring-zinc-200"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
