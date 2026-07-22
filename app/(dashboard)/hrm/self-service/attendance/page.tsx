import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-zinc-900 text-white",
  LATE: "bg-zinc-200 text-zinc-600",
  ABSENT: "bg-zinc-200 text-zinc-600",
  HALF_DAY: "bg-zinc-200 text-zinc-600",
  ON_LEAVE: "bg-zinc-200 text-zinc-700",
  HOLIDAY: "bg-zinc-200 text-zinc-700",
};

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default async function ESSAttendancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const employee = await prisma.hRMEmployee.findFirst({
    where: { userId: Number(session.user.id), deletedAt: null },
  });
  if (!employee) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-400">
        No employee record linked to your account. Contact HR.
      </div>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [records, summary] = await Promise.all([
    prisma.hRMAttendance.findMany({
      where: { employeeId: employee.id, date: { gte: startOfMonth } },
      orderBy: { date: "desc" },
    }),
    prisma.hRMAttendance.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { employeeId: employee.id, date: { gte: startOfMonth } },
    }),
  ]);

  const summaryMap = Object.fromEntries(summary.map((s) => [s.status, s._count.id]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">My Attendance</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Present", key: "PRESENT", color: "emerald" },
          { label: "Late", key: "LATE", color: "orange" },
          { label: "Absent", key: "ABSENT", color: "red" },
          { label: "On Leave", key: "ON_LEAVE", color: "blue" },
        ].map(({ label, key, color }) => (
          <div key={key} className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
            <p className={`text-2xl font-bold text-${color}-600`}>{summaryMap[key] ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Records Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Check In</th>
              <th className="px-4 py-3 text-left">Check Out</th>
              <th className="px-4 py-3 text-left">Working Hrs</th>
              <th className="px-4 py-3 text-left">Overtime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-400">No records this month</td></tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {r.date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[r.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600">{fmt(r.checkIn)}</td>
                <td className="px-4 py-3 text-zinc-600">{fmt(r.checkOut)}</td>
                <td className="px-4 py-3 text-zinc-600">{r.workingHours ? `${Number(r.workingHours).toFixed(1)}h` : "—"}</td>
                <td className="px-4 py-3 text-zinc-700">{r.overtimeHours && Number(r.overtimeHours) > 0 ? `+${Number(r.overtimeHours).toFixed(1)}h` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
