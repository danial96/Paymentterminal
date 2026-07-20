"use client";

import { useState } from "react";
import { saveManualAttendance } from "@/app/actions/hrm-attendance";

export default function ManualMarkForm({
  employeeId,
  date,
  currentStatus,
}: {
  employeeId: number;
  date: string;
  currentStatus?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await saveManualAttendance(fd);
    setLoading(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-zinc-500 hover:underline"
      >
        Mark
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-50 bg-white rounded-xl border border-zinc-200 shadow-lg p-4 w-64">
            <form onSubmit={handleSubmit} className="space-y-2">
              <input type="hidden" name="employeeId" value={employeeId} />
              <input type="hidden" name="date" value={date} />
              <div>
                <label className="text-[10px] text-zinc-500">Status</label>
                <select name="status" defaultValue={currentStatus ?? "PRESENT"} className="w-full rounded border border-zinc-200 px-2 py-1 text-xs mt-0.5">
                  {["PRESENT","ABSENT","LATE","HALF_DAY","EARLY_LEAVE","ON_LEAVE","HOLIDAY","WEEKLY_OFF"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500">Check In</label>
                  <input type="time" name="checkIn" className="w-full rounded border border-zinc-200 px-2 py-1 text-xs mt-0.5" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Check Out</label>
                  <input type="time" name="checkOut" className="w-full rounded border border-zinc-200 px-2 py-1 text-xs mt-0.5" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">Notes</label>
                <input type="text" name="notes" className="w-full rounded border border-zinc-200 px-2 py-1 text-xs mt-0.5" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded py-1.5 text-xs text-white font-medium disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
              >
                {loading && (
                  <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                )}
                {loading ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
