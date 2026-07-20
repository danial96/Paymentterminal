"use client";

import { useState } from "react";
import { createShift } from "@/app/actions/hrm-shifts";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ShiftFormClient() {
  const [shiftType, setShiftType] = useState("MORNING");

  return (
    <form action={createShift} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Shift Name *</label>
        <input name="name" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Start Time *</label>
          <input name="startTime" type="time" defaultValue="09:00" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">End Time *</label>
          <input name="endTime" type="time" defaultValue="18:00" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Break (minutes)</label>
        <input name="breakMinutes" type="number" defaultValue="60" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Shift Type</label>
        <select
          name="shiftType"
          value={shiftType}
          onChange={(e) => setShiftType(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <option value="MORNING">Morning</option>
          <option value="AFTERNOON">Afternoon</option>
          <option value="EVENING">Evening</option>
          <option value="NIGHT">Night</option>
          <option value="FLEXIBLE">Flexible</option>
          <option value="ROTATIONAL">Rotational</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>
      {shiftType === "CUSTOM" && (
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Custom Shift Label *</label>
          <input
            name="customLabel"
            required
            placeholder="e.g. Afternoon, Split, On-Call"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-2">Working Days</label>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((day) => (
            <label key={day} className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" name="workingDays" value={day} defaultChecked={["Mon","Tue","Wed","Thu","Fri"].includes(day)} className="rounded" />
              <span className="text-xs text-zinc-600">{day}</span>
            </label>
          ))}
        </div>
      </div>
      <button type="submit" className="btn-brand w-full rounded-lg py-2 text-sm font-medium text-white">Add Shift</button>
    </form>
  );
}
