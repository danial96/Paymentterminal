import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { saveManualAttendance } from "@/app/actions/hrm-attendance";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-red-100 text-red-600",
  LATE: "bg-orange-100 text-orange-600",
  HALF_DAY: "bg-amber-100 text-amber-600",
  EARLY_LEAVE: "bg-yellow-100 text-yellow-600",
  ON_LEAVE: "bg-blue-100 text-blue-600",
  HOLIDAY: "bg-purple-100 text-purple-600",
  WEEKLY_OFF: "bg-zinc-100 text-zinc-500",
};

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

  const [employees, departments, attendanceRecords] = await Promise.all([
    prisma.hRMEmployee.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...(dept ? { departmentId: Number(dept) } : {}),
        ...(emp ? { id: Number(emp) } : {}),
      },
      include: { department: true, designation: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMAttendance.findMany({
      where: {
        date: selectedDate,
        ...(emp ? { employeeId: Number(emp) } : {}),
        ...(dept ? { employee: { departmentId: Number(dept) } } : {}),
      },
    }),
  ]);

  const attendanceMap = new Map(attendanceRecords.map((a) => [a.employeeId, a]));

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absentCount = employees.filter((e) => !attendanceMap.has(e.id) || attendanceMap.get(e.id)?.status === "ABSENT").length;
  const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
  const leaveCount = attendanceRecords.filter((a) => a.status === "ON_LEAVE").length;

  const todayStr = today.toISOString().split("T")[0];
  const selectedStr = selectedDate.toISOString().split("T")[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Attendance</h1>
        <p className="text-sm text-zinc-500">{selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Present", value: presentCount, color: "text-emerald-600 bg-emerald-50" },
          { label: "Absent", value: absentCount, color: "text-red-600 bg-red-50" },
          { label: "Late", value: lateCount, color: "text-orange-600 bg-orange-50" },
          { label: "On Leave", value: leaveCount, color: "text-blue-600 bg-blue-50" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border border-zinc-200 p-4 ${color.split(" ")[1]}`}>
            <p className={`text-2xl font-bold ${color.split(" ")[0]}`}>{value}</p>
            <p className="text-xs font-medium text-zinc-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-2 items-center flex-wrap">
        <input name="date" type="date" defaultValue={selectedStr} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <select name="dept" defaultValue={dept} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Filter</button>
        <Link href="/hrm/attendance" className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Today</Link>
      </form>

      {/* Attendance Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Daily Attendance — {employees.length} employees</h2>
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
                <th className="px-4 py-3 text-left">Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {employees.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-400">No employees found</td></tr>
              )}
              {employees.map((emp) => {
                const att = attendanceMap.get(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
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
                      {att?.checkIn ? att.checkIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {att?.checkOut ? att.checkOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">{att?.workingHours ? `${Number(att.workingHours).toFixed(1)}h` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-orange-600">{att?.lateMinutes ? `${att.lateMinutes}min` : "—"}</td>
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
                      <details className="relative">
                        <summary className="text-xs text-indigo-600 cursor-pointer list-none hover:underline">Mark</summary>
                        <div className="absolute right-0 top-6 z-10 bg-white rounded-xl border border-zinc-200 shadow-lg p-4 w-64">
                          <form action={saveManualAttendance} className="space-y-2">
                            <input type="hidden" name="employeeId" value={emp.id} />
                            <input type="hidden" name="date" value={selectedStr} />
                            <div>
                              <label className="text-[10px] text-zinc-500">Status</label>
                              <select name="status" defaultValue={att?.status ?? "PRESENT"} className="w-full rounded border border-zinc-200 px-2 py-1 text-xs mt-0.5">
                                {["PRESENT","ABSENT","LATE","HALF_DAY","EARLY_LEAVE","ON_LEAVE","HOLIDAY","WEEKLY_OFF"].map((s) => (
                                  <option key={s} value={s}>{s.replace("_", " ")}</option>
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
                            <button type="submit" className="w-full rounded bg-indigo-600 py-1.5 text-xs text-white font-medium hover:bg-indigo-700">Save</button>
                          </form>
                        </div>
                      </details>
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
