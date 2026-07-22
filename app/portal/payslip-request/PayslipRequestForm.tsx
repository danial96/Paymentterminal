"use client";

import { useState } from "react";
import { requestPayslip } from "@/app/actions/hrm-payslip-request";
import { useRouter } from "next/navigation";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function PayslipRequestForm({ currentMonth, currentYear, years }: { currentMonth: number; currentYear: number; years: number[] }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const result = await requestPayslip(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => { setSuccess(false); router.refresh(); }, 1500);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">Request submitted successfully!</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* From */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">From</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Month</label>
              <select name="month" required defaultValue={currentMonth} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29c0d5]">
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Year</label>
              <select name="year" required defaultValue={currentYear} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29c0d5]">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* To */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">To <span className="text-zinc-400 font-normal normal-case">(optional — leave blank for single month)</span></p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Month</label>
              <select name="toMonth" defaultValue="" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#503d98]">
                <option value="">—</option>
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Year</label>
              <select name="toYear" defaultValue="" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#503d98]">
                <option value="">—</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
}
