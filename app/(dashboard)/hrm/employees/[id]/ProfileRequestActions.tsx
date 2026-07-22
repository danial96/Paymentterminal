"use client";

import { useTransition, useState } from "react";
import { approveProfileUpdateRequest, rejectProfileUpdateRequest } from "@/app/actions/hrm-profile-requests";

interface Props {
  requestId: number;
  employeeId: number;
  fieldLabel: string;
  currentValue: string | null;
  requestedValue: string;
}

export default function ProfileRequestActions({ requestId, employeeId, fieldLabel, currentValue, requestedValue }: Props) {
  const [approving, startApprove] = useTransition();
  const [rejecting, startReject] = useTransition();
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);
  const [hrNote, setHrNote] = useState("");

  if (done) {
    return (
      <div className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold text-center transition-all ${
        result === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
      }`}>
        {result === "approved" ? "Approved" : "Rejected"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-zinc-800">{fieldLabel}</p>
        <p className="text-[11px] text-zinc-500">
          <span className="text-zinc-400">Current:</span> {currentValue || "—"}
        </p>
        <p className="text-[11px] text-zinc-700 font-medium">
          <span className="text-zinc-400">Requested:</span> {requestedValue}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <button
          disabled={approving || rejecting}
          onClick={() => startApprove(async () => {
            await approveProfileUpdateRequest(requestId, employeeId);
            setResult("approved");
            setDone(true);
          })}
          className="rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1"
        >
          {approving && <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          Approve
        </button>
        <input
          value={hrNote}
          onChange={(e) => setHrNote(e.target.value)}
          placeholder="Reason (optional)"
          className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-400 min-w-0"
        />
        <button
          disabled={approving || rejecting}
          onClick={() => {
            const fd = new FormData();
            fd.set("id", String(requestId));
            fd.set("employeeId", String(employeeId));
            fd.set("hrNote", hrNote);
            startReject(async () => {
              await rejectProfileUpdateRequest(fd);
              setResult("rejected");
              setDone(true);
            });
          }}
          className="rounded-md border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all flex items-center gap-1"
        >
          {rejecting && <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          Reject
        </button>
      </div>
    </div>
  );
}
