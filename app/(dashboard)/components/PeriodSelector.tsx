"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PERIODS = [
  { key: "1m",  label: "1 Month" },
  { key: "3m",  label: "3 Months" },
  { key: "6m",  label: "6 Months" },
  { key: "1y",  label: "1 Year" },
  { key: "all", label: "All Time" },
];

export default function PeriodSelector({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(key: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("period", key);
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => select(p.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            active === p.key
              ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
