"use client";

import { useTransition } from "react";
import { portalCheckIn, portalCheckOut } from "@/app/actions/hrm-portal";

type Props = {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string | null;
  workingHours: string | null;
};

export function AttendanceCheckIn({ hasCheckedIn, hasCheckedOut, checkInTime, checkOutTime, status, workingHours }: Props) {
  const [isPending, startTransition] = useTransition();

  const STATUS_STYLE: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    LATE: "bg-yellow-100 text-yellow-700",
    ON_LEAVE: "bg-blue-100 text-blue-700",
    ABSENT: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Times row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Check In</p>
          <p className="text-lg font-bold text-zinc-900">{checkInTime ?? "—"}</p>
        </div>
        <div className="h-8 w-px bg-zinc-100 hidden sm:block" />
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Check Out</p>
          <p className="text-lg font-bold text-zinc-900">{checkOutTime ?? "—"}</p>
        </div>
        <div className="h-8 w-px bg-zinc-100 hidden sm:block" />
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Hours</p>
          <p className="text-lg font-bold text-zinc-900">{workingHours ? `${workingHours}h` : "—"}</p>
        </div>
        {status && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status] ?? "bg-zinc-100 text-zinc-600"}`}>
            {status.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Button row */}
      <div className="flex items-center gap-2">
        {!hasCheckedIn && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => { await portalCheckIn(); })}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-opacity"
            style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {isPending ? "Checking in…" : "Check In"}
          </button>
        )}
        {hasCheckedIn && !hasCheckedOut && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => { await portalCheckOut(); })}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isPending ? "Checking out…" : "Check Out"}
          </button>
        )}
        {hasCheckedIn && hasCheckedOut && (
          <span className="text-xs text-zinc-400 italic">Attendance complete for today</span>
        )}
      </div>
    </div>
  );
}
