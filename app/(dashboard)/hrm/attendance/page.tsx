import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ManualMarkForm from "./ManualMarkForm";
import { MachineSyncButton } from "../employees/MachineSyncButton";
import { getLastZKSync } from "@/app/actions/zkteco";

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
  searchParams: Promise<{ date?: string; emp?: string; dept?: string }>;
}) {
  await requireUser();
  const { date: dateParam, emp, dept } = await searchParams;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = dateParam ? new Date(dateParam) : today;
  selectedDate.setHours(0, 0, 0, 0);
  const selectedStr = selectedDate.toISOString().split("T")[0];

  const [allEmployees, departments, attendanceRecords, lastSync] = await Promise.all([
    prisma.hRMEmployee.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: { department: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMAttendance.findMany({ where: { date: selectedDate } }),
    getLastZKSync(),
  ]);

  // Filter employees by dept and/or specific employee selection
  const employees = allEmployees.filter((e) => {
    if (dept && e.departmentId !== Number(dept)) return false;
    if (emp && e.id !== Number(emp)) return false;
    return true;
  });

  const attendanceMap = new Map(attendanceRecords.map((a) => [a.employeeId, a]));

  // Sort: checked-in employees first (by checkIn desc), then rest alphabetically
  const sorted = [...employees].sort((a, b) => {
    const attA = attendanceMap.get(a.id);
    const attB = attendanceMap.get(b.id);
    if (attA?.checkIn && attB?.checkIn) {
      return new Date(attB.checkIn).getTime() - new Date(attA.checkIn).getTime();
    }
    if (attA?.checkIn) return -1;
    if (attB?.checkIn) return 1;
    return 0;
  });

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absentCount = employees.filter((e) => !attendanceMap.has(e.id) || attendanceMap.get(e.id)?.status === "ABSENT").length;
  const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
  const leaveCount = attendanceRecords.filter((a) => a.status === "ON_LEAVE").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Attendance</h1>
        <div className="flex items-center gap-3">
          <MachineSyncButton lastSync={lastSync ? { syncedAt: lastSync.syncedAt, source: lastSync.source, enrolled: lastSync.enrolled } : null} />
          <p className="text-sm text-zinc-500">{selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Present", value: presentCount, color: "text-emerald-600" },
          { label: "Absent", value: absentCount, color: "text-red-500" },
          { label: "Late", value: lateCount, color: "text-yellow-600" },
          { label: "On Leave", value: leaveCount, color: "text-blue-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-2 items-center flex-wrap">
        <input
          name="date"
          type="date"
          defaultValue={selectedStr}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <select name="emp" defaultValue={emp} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 w-52">
          <option value="">All Employees</option>
          {allEmployees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
        </select>
        <select name="dept" defaultValue={dept} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="submit" className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white">Filter</button>
        <Link href="/hrm/attendance" className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Today</Link>
      </form>

      {/* Attendance Table */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="px-4 py-3 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">
            {selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} — {employees.length} employee{employees.length !== 1 ? "s" : ""}
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
                    <td className="px-4 py-3 text-xs font-mono">{att?.checkIn ? fmtTime(att.checkIn) : "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono">{att?.checkOut ? fmtTime(att.checkOut) : "—"}</td>
                    <td className="px-4 py-3 text-xs">{att?.workingHours ? fmtHours(att.workingHours) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{att?.lateMinutes ? `${att.lateMinutes}min` : "—"}</td>
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">✎ Manual</span>
                      ) : att ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">⊞ Biometric</span>
                      ) : (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ManualMarkForm employeeId={emp.id} date={selectedStr} currentStatus={att?.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
