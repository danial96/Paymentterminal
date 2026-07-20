"use client";

import { useState } from "react";
import { requestPayslip } from "@/app/actions/hrm-payslip-request";
import { useRouter } from "next/navigation";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function PayslipRequestForm({ currentMonth, currentYear, years }: { currentMonth: number; currentYear: number; years: number[] }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await requestPayslip(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) setError(result.error);
    else router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4 flex-wrap">
      {error && <p className="w-full text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Month *</label>
        <select name="month" required defaultValue={currentMonth} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Year *</label>
        <select name="year" required defaultValue={currentYear} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading} className="rounded-lg px-6 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}>
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
