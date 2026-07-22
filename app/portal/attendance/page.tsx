export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FilterForm } from "@/app/components/FilterForm";

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800",
  ABSENT: "bg-red-100 text-red-800",
  LATE: "bg-yellow-100 text-yellow-800",
  HALF_DAY: "bg-orange-100 text-orange-700",
  EARLY_LEAVE: "bg-amber-100 text-amber-700",
  ON_LEAVE: "bg-blue-100 text-blue-800",
  HOLIDAY: "bg-purple-100 text-purple-800",
  OFF: "bg-zinc-100 text-zinc-500",
};

export default async function PortalAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const now = new Date();
  const { month: monthParam, year: yearParam } = await searchParams;
  const month = monthParam ? Number(monthParam) : now.getMonth() + 1;
  const year = yearParam ? Number(yearParam) : now.getFullYear();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const records = await prisma.hRMAttendance.findMany({
    where: { employeeId: empId, date: { gte: start, lte: end } },
    orderBy: { date: "desc" },
  });

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const present = records.filter(r => r.status === "PRESENT" || r.status === "LATE" || r.status === "EARLY_LEAVE").length;
  const absent = records.filter(r => r.status === "ABSENT").length;
  const late = records.filter(r => r.status === "LATE").length;
  const onLeave = records.filter(r => r.status === "ON_LEAVE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">My Attendance</h1>
          <p className="text-sm text-zinc-500">{MONTHS[month - 1]} {year}</p>
        </div>

        <FilterForm action="/portal/attendance" className="flex items-center gap-2">
          <select
            name="month"
            defaultValue={month}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={year}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
          >
            Go
          </button>
        </FilterForm>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Present", value: present, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Absent", value: absent, color: "text-red-500", bg: "bg-red-50 border-red-100" },
          { label: "Late", value: late, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-100" },
          { label: "On Leave", value: onLeave, color: "text-blue-500", bg: "bg-blue-50 border-blue-100" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Day</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Check In</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Check Out</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No attendance records found for {MONTHS[month - 1]} {year}.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-900">{r.date.toLocaleDateString()}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {r.date.toLocaleDateString("en-US", { weekday: "short" })}
                </td>
                <td className="px-4 py-3 text-zinc-700">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td className="px-4 py-3 text-zinc-700">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      STATUS_STYLES[r.status] ?? "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{r.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
