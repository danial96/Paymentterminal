import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCakeCandles, faTrophy } from "@fortawesome/free-solid-svg-icons";

function StatCard({ label, value, sub, href, color }: { label: string; value: string | number; sub?: string; href: string; color: string }) {
  return (
    <Link href={href} className="rounded-xl border border-zinc-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className={`text-xs font-semibold uppercase tracking-widest ${color} mb-1`}>{label}</div>
      <div className="text-3xl font-bold text-zinc-900">{value}</div>
      {sub && <div className="text-xs text-zinc-400 mt-1">{sub}</div>}
    </Link>
  );
}

export default async function HRMDashboard() {
  await requireUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalEmployees,
    activeEmployees,
    presentToday,
    absentToday,
    lateToday,
    pendingLeaves,
    totalDepartments,
    recentEmployees,
    pendingLeaveList,
    upcomingBirthdays,
    upcomingAnniversaries,
    recentNotices,
  ] = await Promise.all([
    prisma.hRMEmployee.count({ where: { deletedAt: null } }),
    prisma.hRMEmployee.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.hRMAttendance.count({ where: { date: today, status: { in: ["PRESENT", "LATE"] } } }),
    prisma.hRMAttendance.count({ where: { date: today, status: "ABSENT" } }),
    prisma.hRMAttendance.count({ where: { date: today, status: "LATE" } }),
    prisma.hRMLeave.count({ where: { status: "PENDING" } }),
    prisma.hRMDepartment.count({ where: { isActive: true } }),
    prisma.hRMEmployee.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { department: true, designation: true },
    }),
    prisma.hRMLeave.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { employee: true, leaveType: true },
    }),
    prisma.hRMEmployee.findMany({
      where: { deletedAt: null, dateOfBirth: { not: null } },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, department: { select: { name: true } } },
    }),
    prisma.hRMEmployee.findMany({
      where: { deletedAt: null, joiningDate: { not: null } },
      select: { id: true, firstName: true, lastName: true, joiningDate: true, designation: { select: { name: true } } },
    }),
    prisma.hRMNotice.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  // Filter upcoming birthdays (next 30 days)
  const now = new Date();
  const upcoming = upcomingBirthdays
    .map((e) => {
      if (!e.dateOfBirth) return null;
      const bday = new Date(e.dateOfBirth);
      const nextBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
      const diff = (nextBday.getTime() - now.getTime()) / 86400000;
      return diff <= 30 ? { ...e, daysLeft: Math.ceil(diff), nextBday } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a!.daysLeft - b!.daysLeft))
    .slice(0, 5);

  // Work anniversaries (next 30 days)
  const anniversaries = upcomingAnniversaries
    .map((e) => {
      if (!e.joiningDate) return null;
      const jd = new Date(e.joiningDate);
      const nextAnniv = new Date(now.getFullYear(), jd.getMonth(), jd.getDate());
      if (nextAnniv < now) nextAnniv.setFullYear(now.getFullYear() + 1);
      const diff = (nextAnniv.getTime() - now.getTime()) / 86400000;
      const years = nextAnniv.getFullYear() - jd.getFullYear();
      return diff <= 30 ? { ...e, daysLeft: Math.ceil(diff), nextAnniv, years } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysLeft - b!.daysLeft)
    .slice(0, 5);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const todayFormatted = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  // Employees with birthday TODAY
  const birthdayToday = upcomingBirthdays.filter((e) => {
    if (!e.dateOfBirth) return false;
    const bd = new Date(e.dateOfBirth);
    return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">HRM Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{todayFormatted}</p>
        </div>
        <Link href="/hrm/employees/new" className="btn-brand rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity">
          + Add Employee
        </Link>
      </div>

      {/* Today's Birthdays */}
      {birthdayToday.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #f472b6 0%, #a855f7 50%, #503d98 100%)" }}>
          <div className="px-5 py-4 flex items-center gap-4">
            <span className="text-3xl select-none" aria-hidden>🎂</span>
            <div className="flex-1">
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">Today&apos;s Birthdays</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {birthdayToday.map((e) => (
                  <Link key={e.id} href={`/hrm/employees/${e.id}`} className="text-white font-semibold text-sm hover:underline">
                    {e.firstName} {e.lastName}
                    {e.department?.name && <span className="font-normal text-white/70 text-xs ml-1">({e.department.name})</span>}
                  </Link>
                ))}
              </div>
            </div>
            <span className="text-3xl select-none hidden sm:block" aria-hidden>🎉</span>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Employees" value={totalEmployees} sub={`${activeEmployees} active`} href="/hrm/employees" color="text-zinc-500" />
        <StatCard label="Present Today" value={presentToday} sub="checked in" href="/hrm/attendance" color="text-zinc-500" />
        <StatCard label="Absent Today" value={absentToday} href="/hrm/attendance" color="text-zinc-500" />
        <StatCard label="Pending Leaves" value={pendingLeaves} sub="awaiting approval" href="/hrm/leaves" color="text-zinc-500" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Late Today" value={lateToday} href="/hrm/attendance" color="text-zinc-500" />
        <StatCard label="Departments" value={totalDepartments} href="/hrm/departments" color="text-zinc-500" />
        <div className="rounded-xl border border-zinc-200 bg-white p-5 col-span-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Quick Actions</div>
          <div className="flex gap-3 flex-wrap mt-2">
            <Link href="/hrm/payroll/generate" className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">Generate Payroll</Link>
            <Link href="/hrm/notices" className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">Post Notice</Link>
            <Link href="/hrm/employees/new" className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">Add Employee</Link>
            <Link href="/hrm/holidays" className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">Add Holiday</Link>
            <Link href="/hrm/leaves" className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">Manage Leaves</Link>
            <Link href="/hrm/reports" className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">View Reports</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Employees */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Recent Employees</h2>
            <Link href="/hrm/employees" className="text-xs text-zinc-500 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {recentEmployees.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">No employees yet</p>
            )}
            {recentEmployees.map((emp) => (
              <Link key={emp.id} href={`/hrm/employees/${emp.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-zinc-400 truncate">{emp.designation?.name ?? "—"} · {emp.department?.name ?? "—"}</p>
                </div>
                <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  emp.status === "ACTIVE" ? "bg-zinc-900 text-white" :
                  emp.status === "RESIGNED" ? "bg-zinc-200 text-zinc-600" : "bg-zinc-100 text-zinc-500"
                }`}>{emp.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Pending Leave Requests</h2>
            <Link href="/hrm/leaves" className="text-xs text-zinc-500 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {pendingLeaveList.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">No pending leaves</p>
            )}
            {pendingLeaveList.map((leave) => (
              <div key={leave.id} className="px-4 py-3">
                <p className="text-sm font-medium text-zinc-900">{leave.employee.firstName} {leave.employee.lastName}</p>
                <p className="text-xs text-zinc-500">{leave.leaveType.name} · {leave.days} day{leave.days !== 1 ? "s" : ""}</p>
                <p className="text-xs text-zinc-400">
                  {leave.startDate.toLocaleDateString()} → {leave.endDate.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Birthdays + Notices */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Upcoming Birthdays <FontAwesomeIcon icon={faCakeCandles} className="ml-1 h-4 w-4 text-zinc-400" /></h2>
            </div>
            <div className="divide-y divide-zinc-50">
              {upcoming.length === 0 && (
                <p className="px-4 py-4 text-center text-sm text-zinc-400">None in next 30 days</p>
              )}
              {upcoming.map((e) => e && (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                    {e.firstName[0]}{e.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-900">{e.firstName} {e.lastName}</p>
                    <p className="text-[10px] text-zinc-400">{e.nextBday?.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500">{e.daysLeft === 0 ? "Today!" : `${e.daysLeft}d`}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2"><FontAwesomeIcon icon={faTrophy} className="h-3.5 w-3.5 text-[#503d98]" /> Work Anniversaries</h2>
            </div>
            <div className="divide-y divide-zinc-50">
              {anniversaries.length === 0 && (
                <p className="px-4 py-4 text-center text-sm text-zinc-400">None in next 30 days</p>
              )}
              {anniversaries.map((e) => e && (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                    {e.firstName[0]}{e.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-900">{e.firstName} {e.lastName}</p>
                    <p className="text-[10px] text-zinc-400">{e.years} year{e.years !== 1 ? "s" : ""} · {e.nextAnniv?.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500">{e.daysLeft === 0 ? "Today!" : `${e.daysLeft}d`}</span>
                </div>
              ))}
            </div>
          </div>

          {recentNotices.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Latest Notices</h2>
                <Link href="/hrm/notices" className="text-xs text-zinc-500 hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-zinc-50">
                {recentNotices.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        n.priority === "URGENT" ? "bg-zinc-900 text-white" :
                        n.priority === "HIGH" ? "bg-zinc-200 text-zinc-700" : "bg-zinc-100 text-zinc-500"
                      }`}>{n.priority}</span>
                      <p className="text-xs font-medium text-zinc-900 truncate">{n.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
