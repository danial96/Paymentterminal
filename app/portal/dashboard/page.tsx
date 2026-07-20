import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AttendanceCheckIn } from "./AttendanceCheckIn";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

export default async function PortalDashboard() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);

  const [employee, attendance, todayRecord, leaves, balances, notices, payslipRequests, upcomingHolidays] = await Promise.all([
    prisma.hRMEmployee.findUnique({
      where: { id: empId },
      include: { department: true, designation: true },
    }),
    prisma.hRMAttendance.findMany({ where: { employeeId: empId, date: { gte: monthStart } } }),
    prisma.hRMAttendance.findFirst({ where: { employeeId: empId, date: { gte: todayStart, lte: todayEnd } } }),
    prisma.hRMLeave.findMany({
      where: { employeeId: empId, status: "PENDING" },
      include: { leaveType: true },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.hRMLeaveBalance.findMany({
      where: { employeeId: empId, year: now.getFullYear() },
      include: { leaveType: true },
    }),
    prisma.hRMNotice.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.hRMPayslipRequest.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.hRMHoliday.findMany({
      where: { date: { gte: todayStart } },
      orderBy: { date: "asc" },
      take: 3,
    }),
  ]);

  const presentCount = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendance.filter((a) => a.status === "LATE").length;
  const onLeaveCount = attendance.filter((a) => a.status === "ON_LEAVE").length;

  const initials = `${employee?.firstName?.[0] ?? ""}${employee?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">

      {/* Profile card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-zinc-900">
              {employee?.firstName} {employee?.lastName}
            </h1>
            <p className="text-sm text-zinc-500">
              {employee?.designation?.name ?? "—"}
              {employee?.department?.name ? ` · ${employee.department.name}` : ""}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{employee?.employeeId}</p>
          </div>
          <div className="ml-auto hidden sm:grid grid-cols-2 gap-x-8 gap-y-1 text-right">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Joined</p>
              <p className="text-xs font-medium text-zinc-700">
                {employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Type</p>
              <p className="text-xs font-medium text-zinc-700">{employee?.employmentType?.replace("_", " ") ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Email</p>
              <p className="text-xs font-medium text-zinc-700">{employee?.companyEmail ?? employee?.portalEmail ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Status</p>
              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">{employee?.status ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's attendance */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Today&apos;s Attendance</h2>
          <span className="text-xs text-zinc-400">{DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}</span>
        </div>
        <AttendanceCheckIn
          hasCheckedIn={!!todayRecord?.checkIn}
          hasCheckedOut={!!todayRecord?.checkOut}
          checkInTime={todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null}
          checkOutTime={todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null}
          status={todayRecord?.status ?? null}
          workingHours={todayRecord?.workingHours ? String(todayRecord.workingHours) : null}
        />
      </div>

      {/* This month stats */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">{MONTHS[now.getMonth()]} {now.getFullYear()} Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Present" value={presentCount} color="text-green-600" />
          <StatCard label="Absent" value={absentCount} color="text-red-500" />
          <StatCard label="Late" value={lateCount} color="text-yellow-600" />
          <StatCard label="On Leave" value={onLeaveCount} color="text-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Leave balances */}
        {balances.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Leave Balance {now.getFullYear()}</h2>
              <Link href="/portal/leaves" className="text-xs text-zinc-400 hover:text-zinc-600">Apply →</Link>
            </div>
            <div className="space-y-3">
              {balances.map((lb) => {
                const pct = lb.allocated > 0 ? Math.max(0, Math.min(100, (lb.remaining / lb.allocated) * 100)) : 0;
                return (
                  <div key={lb.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-600">{lb.leaveType.name}</span>
                      <span className="font-medium text-zinc-800">{lb.remaining} / {lb.allocated} days</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending leaves */}
        {leaves.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Pending Leave Requests</h2>
              <Link href="/portal/leaves" className="text-xs text-zinc-400 hover:text-zinc-600">View all →</Link>
            </div>
            <div className="space-y-2">
              {leaves.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg bg-yellow-50 border border-yellow-100 px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-800">{l.leaveType.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      {l.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} → {l.endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {l.days} day{l.days !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">PENDING</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming holidays */}
        {upcomingHolidays.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Upcoming Holidays</h2>
            <div className="space-y-2">
              {upcomingHolidays.map((h) => (
                <div key={h.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-purple-50 border border-purple-100">
                    <p className="text-[10px] font-bold text-purple-500 leading-none">{MONTHS[new Date(h.date).getMonth()]}</p>
                    <p className="text-sm font-bold text-purple-700 leading-none">{new Date(h.date).getDate()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-800">{h.name}</p>
                    <p className="text-[10px] text-zinc-400">{DAYS[new Date(h.date).getDay()]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent payslip requests */}
        {payslipRequests.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Payslip Requests</h2>
              <Link href="/portal/payslip-request" className="text-xs text-zinc-400 hover:text-zinc-600">New request →</Link>
            </div>
            <div className="space-y-2">
              {payslipRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 text-xs">{MONTHS[req.month - 1]} {req.year}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    req.status === "FULFILLED" ? "bg-green-100 text-green-700" :
                    req.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-zinc-100 text-zinc-500"
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Latest notices */}
      {notices.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900">Latest Notices</h2>
            <Link href="/portal/notices" className="text-xs text-zinc-400 hover:text-zinc-600">View all →</Link>
          </div>
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                {n.content && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{n.content}</p>}
                <p className="text-[10px] text-zinc-400 mt-1.5">{n.publishedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
