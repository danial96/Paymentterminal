import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ManualMarkForm from "./ManualMarkForm";
import { MachineSyncButton } from "../employees/MachineSyncButton";
import { getLastZKSync } from "@/app/actions/zkteco";
import AttendanceFilters from "./AttendanceFilters";

const STATUS_COLORS: Record<string, string> = {
  PRESENT:    "bg-emerald-100 text-emerald-700",
  ABSENT:     "bg-red-100 text-red-600",
  LATE:       "bg-yellow-100 text-yellow-700",
  HALF_DAY:   "bg-orange-100 text-orange-600",
  EARLY_LEAVE:"bg-orange-100 text-orange-600",
  ON_LEAVE:   "bg-blue-100 text-blue-600",
  HOLIDAY:    "bg-purple-100 text-purple-600",
  WEEKLY_OFF: "bg-zinc-100 text-zinc-500",
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function fmtHours(h: unknown) {
  const n = Number(h);
  return `${Math.floor(n)}h ${Math.round((n % 1) * 60)}m`;
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; from?: string; to?: string; emp?: string; dept?: string }>;
}) {
  await requireUser();
  const { date: dateParam, from: fromParam, to: toParam, emp, dept } = await searchParams;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Support both legacy ?date= and new ?from=&to= params
  const fromStr = fromParam ?? dateParam ?? todayStr;
  const toStr = toParam ?? fromStr;
  const isRange = fromStr !== toStr;

  const fromDate = new Date(fromStr + "T00:00:00.000Z");
  const toDate = new Date(toStr + "T00:00:00.000Z");

  const [allEmployees, departments, attendanceRecords, lastSync] = await Promise.all([
    prisma.hRMEmployee.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: { department: true, shift: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMAttendance.findMany({
      where: {
        date: isRange ? { gte: fromDate, lte: toDate } : fromDate,
      },
      orderBy: isRange ? [{ date: "asc" }, { checkIn: "asc" }] : undefined,
    }),
    getLastZKSync(),
  ]);

  // Filter employees by dept and/or specific employee selection
  const employees = allEmployees.filter((e) => {
    if (dept && e.departmentId !== Number(dept)) return false;
    if (emp && e.id !== Number(emp)) return false;
    return true;
  });

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absentCount = isRange ? 0 : employees.filter((e) => {
    const found = attendanceRecords.find((a) => a.employeeId === e.id);
    return !found || found.status === "ABSENT";
  }).length;
  const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
  const leaveCount = attendanceRecords.filter((a) => a.status === "ON_LEAVE").length;
  const earlyLeaveCount = attendanceRecords.filter((a) => a.status === "EARLY_LEAVE").length;
  const halfDayCount = attendanceRecords.filter((a) => a.status === "HALF_DAY").length;

  // For single date: build attendanceMap and sort employees
  const attendanceMap = new Map(
    isRange ? [] : attendanceRecords.map((a) => [a.employeeId, a])
  );

  const sorted = isRange ? [] : [...employees].sort((a, b) => {
    const attA = attendanceMap.get(a.id);
    const attB = attendanceMap.get(b.id);
    if (attA?.checkIn && attB?.checkIn) return new Date(attB.checkIn).getTime() - new Date(attA.checkIn).getTime();
    if (attA?.checkIn) return -1;
    if (attB?.checkIn) return 1;
    return 0;
  });

  // For range view: group records by date
  const byDate = new Map<string, typeof attendanceRecords>();
  if (isRange) {
    for (const rec of attendanceRecords) {
      const empInFilter = employees.find((e) => e.id === rec.employeeId);
      if (!empInFilter) continue;
      const dateKey = new Date(rec.date).toISOString().slice(0, 10);
      if (!byDate.has(dateKey)) byDate.set(dateKey, []);
      byDate.get(dateKey)!.push(rec);
    }
  }

  const empLookup = new Map(allEmployees.map((e) => [e.id, e]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-zinc-900">Attendance</h1>
        <div className="flex items-center gap-3">
          <MachineSyncButton lastSync={lastSync ? { syncedAt: lastSync.syncedAt, source: lastSync.source, enrolled: lastSync.enrolled } : null} />
          <p className="text-sm text-zinc-500">
            {isRange
              ? `${new Date(fromStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(toStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              : new Date(fromStr).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
            }
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Present", value: presentCount, color: "text-emerald-600" },
          { label: "Absent", value: absentCount, color: "text-red-500" },
          { label: "Late", value: lateCount, color: "text-yellow-600" },
          { label: "Half Day", value: halfDayCount, color: "text-orange-500" },
          { label: "Early Leave", value: earlyLeaveCount, color: "text-orange-600" },
          { label: "On Leave", value: leaveCount, color: "text-blue-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] font-medium text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <AttendanceFilters
        employees={allEmployees}
        departments={departments}
        currentEmp={emp}
        currentDept={dept}
        currentFrom={fromStr}
        currentTo={toStr}
        isRange={isRange}
      />

      {/* Table */}
      {isRange ? (
        // Date range view — grouped by date
        <div className="space-y-4">
          {byDate.size === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center text-zinc-400 text-sm">No attendance records in this range.</div>
          )}
          {[...byDate.entries()].map(([dateKey, recs]) => (
            <div key={dateKey} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-700">
                  {new Date(dateKey + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="text-xs text-zinc-400">{recs.length} record{recs.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Employee</th>
                      <th className="px-4 py-2 text-left">Check In</th>
                      <th className="px-4 py-2 text-left">Check Out</th>
                      <th className="px-4 py-2 text-left">Hours</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {recs.map((rec) => {
                      const e = empLookup.get(rec.employeeId);
                      return (
                        <tr key={rec.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-zinc-900 text-xs">{e ? `${e.firstName} ${e.lastName}` : rec.employeeId}</p>
                            <p className="text-[10px] text-zinc-400">{e?.employeeId}</p>
                          </td>
                          <td className="px-4 py-2.5 text-xs font-mono">{rec.checkIn ? fmtTime(rec.checkIn) : "—"}</td>
                          <td className="px-4 py-2.5 text-xs font-mono">{rec.checkOut ? fmtTime(rec.checkOut) : "—"}</td>
                          <td className="px-4 py-2.5 text-xs">{rec.workingHours ? fmtHours(rec.workingHours) : "—"}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[rec.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                              {rec.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Single date view
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">
              {new Date(fromStr + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} — {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Check In</th>
                  <th className="px-4 py-3 text-left">Check Out</th>
                  <th className="px-4 py-3 text-left">Hours</th>
                  <th className="px-4 py-3 text-left">Late</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sorted.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-zinc-400">No employees found</td></tr>
                )}
                {sorted.map((emp) => {
                  const att = attendanceMap.get(emp.id);

                  // Early check-in / overtime detection — compare in PKT (UTC+5), handles overnight shifts
                  const shiftStart = emp.shift?.startTime ?? "14:00";
                  const shiftEnd   = emp.shift?.endTime   ?? "23:00";
                  const [sH, sM] = shiftStart.split(":").map(Number);
                  const [eH, eM] = shiftEnd.split(":").map(Number);
                  const startMins = sH * 60 + sM;
                  const endMins   = eH * 60 + eM;
                  // Overnight shift: end < start (e.g. 15:00→00:00), treat end as next-day (+1440)
                  const effectiveEndMins = endMins < startMins ? endMins + 1440 : endMins;
                  const toPktMins = (d: Date) => { const pkt = new Date(d.getTime() + 5 * 3600000); return pkt.getUTCHours() * 60 + pkt.getUTCMinutes(); };
                  const toEffectivePktMins = (d: Date) => { const m = toPktMins(d); return m < startMins ? m + 1440 : m; };
                  const isEarlyIn = att?.checkIn  && toPktMins(new Date(att.checkIn))  < startMins;
                  const isLateOut = att?.checkOut && toEffectivePktMins(new Date(att.checkOut)) > effectiveEndMins;

                  return (
                    <tr key={emp.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[10px] text-zinc-400">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{emp.department?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {att?.checkIn ? fmtTime(att.checkIn) : "—"}
                        {isEarlyIn && <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">Early</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {att?.checkOut ? fmtTime(att.checkOut) : "—"}
                        {isLateOut && <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700">Overtime</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">{att?.workingHours ? fmtHours(att.workingHours) : "—"}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{att?.lateMinutes ? `${Math.floor(att.lateMinutes / 60)}:${String(att.lateMinutes % 60).padStart(2, "0")}` : "—"}</td>
                      <td className="px-4 py-3">
                        {att ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[att.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                            {att.status.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-400">Not Recorded</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {att?.isManual ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Manual
                          </span>
                        ) : att ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                            Biometric
                          </span>
                        ) : (
                          <span className="text-zinc-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ManualMarkForm employeeId={emp.id} date={fromStr} currentStatus={att?.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
