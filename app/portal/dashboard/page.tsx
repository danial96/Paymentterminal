export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AttendanceCheckIn } from "./AttendanceCheckIn";
import BirthdayCelebration from "./BirthdayCelebration";
import BirthdayWishSender from "./BirthdayWishSender";
import BirthdayWishes from "./BirthdayWishes";
import AnniversaryWishSender from "./AnniversaryWishSender";
import AnniversaryWishes from "./AnniversaryWishes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck, faXmark, faClock, faUmbrellaBeach,
  faCakeCandles, faTrophy, faStar,
  faTriangleExclamation, faCalendarDays, faFileLines, faUsers, faBullhorn,
} from "@fortawesome/free-solid-svg-icons";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default async function PortalDashboard() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  // Compute PKT "now" and work day date (day changes at 3 AM PKT)
  const pktNow = new Date(Date.now() + 5 * 3600000);
  const todayStart = new Date(Date.UTC(pktNow.getUTCFullYear(), pktNow.getUTCMonth(), pktNow.getUTCDate()));
  if (pktNow.getUTCHours() < 3) todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
  const monthStart = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1));
  const now = pktNow; // used for birthday/anniversary date comparisons

  const [employee, attendance, todayRecord, leaves, balances, notices, payslipRequests, upcomingHolidays, allEmployees, myWishesReceived, myWishesSent, myAnnivWishesReceived, myAnnivWishesSent] = await Promise.all([
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
    prisma.hRMEmployee.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, joiningDate: true },
    }),
    // Wishes I received today (if it's my birthday)
    (prisma as any).hRMBirthdayWish.findMany({
      where: { toId: empId, year: now.getFullYear() },
      orderBy: { createdAt: "asc" },
      include: { from: { select: { firstName: true, lastName: true } } },
    }),
    // Wishes I already sent this year (to know which birthday people I've already wished)
    (prisma as any).hRMBirthdayWish.findMany({
      where: { fromId: empId, year: now.getFullYear() },
      select: { toId: true },
    }),
    // Anniversary compliments I received this year
    (prisma as any).hRMAnniversaryWish.findMany({
      where: { toId: empId, year: now.getFullYear() },
      orderBy: { createdAt: "asc" },
      include: { from: { select: { firstName: true, lastName: true } } },
    }),
    // Anniversary compliments I already sent this year
    (prisma as any).hRMAnniversaryWish.findMany({
      where: { fromId: empId, year: now.getFullYear() },
      select: { toId: true },
    }),
  ]);

  const presentCount = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendance.filter((a) => a.status === "LATE").length;
  const onLeaveCount = attendance.filter((a) => a.status === "ON_LEAVE").length;

  const initials = `${employee?.firstName?.[0] ?? ""}${employee?.lastName?.[0] ?? ""}`.toUpperCase();

  // Check if today is this employee's birthday
  const isBirthday = (() => {
    if (!employee?.dateOfBirth) return false;
    const bd = new Date(employee.dateOfBirth);
    return bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate();
  })();

  // Check if today is this employee's work anniversary
  const anniversaryYears = (() => {
    if (!employee?.joiningDate) return 0;
    const jd = new Date(employee.joiningDate);
    if (jd.getMonth() !== now.getMonth() || jd.getDate() !== now.getDate()) return 0;
    return now.getFullYear() - jd.getFullYear();
  })();
  const isAnniversary = anniversaryYears > 0;

  // Other employees with birthday today (excluding self)
  const otherBirthdayPeople = allEmployees.filter((e) => {
    if (e.id === empId || !e.dateOfBirth) return false;
    const bd = new Date(e.dateOfBirth);
    return bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate();
  });

  const alreadyWishedIds: number[] = (myWishesSent as any[]).map((w: any) => w.toId);
  const alreadyComplimentedIds: number[] = (myAnnivWishesSent as any[]).map((w: any) => w.toId);

  // Other employees with work anniversary today (excluding self)
  const otherAnniversaryPeople = allEmployees
    .filter((e) => {
      if (e.id === empId || !e.joiningDate) return false;
      const jd = new Date(e.joiningDate);
      if (jd.getMonth() !== now.getMonth() || jd.getDate() !== now.getDate()) return false;
      return now.getFullYear() - jd.getFullYear() > 0;
    })
    .map((e) => {
      const jd = new Date(e.joiningDate!);
      return { ...e, years: now.getFullYear() - jd.getFullYear() };
    });

  const upcomingBirthdays = allEmployees
    .filter((e) => e.dateOfBirth)
    .map((e) => {
      const bd = new Date(e.dateOfBirth!);
      const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      const diff = Math.ceil((next.getTime() - now.getTime()) / 86400000);
      return diff <= 30 ? { ...e, daysLeft: diff, next } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysLeft - b!.daysLeft)
    .slice(0, 5);

  const upcomingAnniversaries = allEmployees
    .filter((e) => e.joiningDate)
    .map((e) => {
      const jd = new Date(e.joiningDate!);
      const next = new Date(now.getFullYear(), jd.getMonth(), jd.getDate());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      const diff = Math.ceil((next.getTime() - now.getTime()) / 86400000);
      const years = next.getFullYear() - jd.getFullYear();
      return diff <= 30 && years > 0 ? { ...e, daysLeft: diff, next, years } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysLeft - b!.daysLeft)
    .slice(0, 5);

  const wh = todayRecord?.workingHours ? Number(todayRecord.workingHours) : null;
  const whStr = wh !== null ? `${Math.floor(wh)}h ${Math.round((wh % 1) * 60)}m` : null;

  return (
    <div className="space-y-5">

      {/* ── Birthday celebration (my birthday) ─────────────────────── */}
      {isBirthday && (
        <>
          <BirthdayCelebration name={employee?.firstName ?? ""} />
          <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #f472b6 0%, #a855f7 50%, #503d98 100%)" }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="relative px-6 py-5 flex items-center gap-5">
              <svg className="h-12 w-12 shrink-0 text-white/90" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10.34 2 9 3.34 9 5c0 1.1.6 2.06 1.5 2.6V9H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2v-9a2 2 0 00-2-2h-3.5V7.6C14.4 7.06 15 6.1 15 5c0-1.66-1.34-3-3-3zm0 2a1 1 0 110 2 1 1 0 010-2zm-4 7h8v9H8v-9z"/></svg>
              <div className="flex-1">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-0.5">Special Day</p>
                <h2 className="text-white text-2xl font-bold leading-tight">Happy Birthday, {employee?.firstName}!</h2>
                <p className="text-white/80 text-sm mt-1">Wishing you a wonderful day filled with joy. The entire IKIA Tech team celebrates with you!</p>
              </div>
            </div>
            <div className="mx-6 mb-5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-4">
              <p className="text-white text-sm font-semibold mb-1">A message from IKIA Tech</p>
              <p className="text-white/90 text-sm leading-relaxed">"On your special day, we want you to know how much you mean to our team. Your dedication and hard work make a real difference every single day. Here&apos;s to another amazing year ahead — keep shining!"</p>
              <p className="text-white/60 text-xs mt-2">— IKIA Tech Family</p>
            </div>
          </div>
          <BirthdayWishes wishes={myWishesReceived.map((w: any) => ({ id: w.id, message: w.message, createdAt: w.createdAt.toISOString(), from: w.from }))} />
        </>
      )}

      {/* ── Wish sender (for non-birthday employees) ────────────────── */}
      {!isBirthday && otherBirthdayPeople.length > 0 && (
        <BirthdayWishSender birthdayPeople={otherBirthdayPeople} alreadyWished={alreadyWishedIds} />
      )}

      {/* ── Work anniversary banner ─────────────────────────────────── */}
      {isAnniversary && (
        <>
          <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #503d98 0%, #29c0d5 100%)" }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 60%, white 1px, transparent 1px), radial-gradient(circle at 75% 30%, white 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
            <div className="relative px-6 py-5 flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 border border-white/30">
                <FontAwesomeIcon icon={faTrophy} className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-0.5">Work Anniversary</p>
                <h2 className="text-white text-2xl font-bold leading-tight">
                  {anniversaryYears} Year{anniversaryYears !== 1 ? "s" : ""} at IKIA Tech, {employee?.firstName}!
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Thank you for {anniversaryYears} incredible year{anniversaryYears !== 1 ? "s" : ""} of dedication and hard work. Your journey with us has been truly meaningful!
                </p>
              </div>
            </div>
            <div className="mx-6 mb-5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-4">
              <p className="text-white text-sm font-semibold mb-1">A note from IKIA Tech</p>
              <p className="text-white/90 text-sm leading-relaxed">
                "Every year you spend with us adds to the story of something great. Your commitment, energy, and passion inspire everyone around you. Here&apos;s to many more years of success together!"
              </p>
              <p className="text-white/60 text-xs mt-2">— IKIA Tech Family</p>
            </div>
          </div>
          <AnniversaryWishes wishes={myAnnivWishesReceived.map((w: any) => ({ id: w.id, message: w.message, createdAt: w.createdAt.toISOString(), from: w.from }))} />
        </>
      )}

      {/* ── Other employees' anniversaries (for non-anniversary employees) */}
      {!isAnniversary && otherAnniversaryPeople.length > 0 && (
        <AnniversaryWishSender
          anniversaryPeople={otherAnniversaryPeople}
          alreadyComplimentedIds={alreadyComplimentedIds}
        />
      )}

      {/* ── Profile banner ─────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden">
        <div className="h-20 w-full" style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }} />
        <div className="bg-white border border-zinc-200 border-t-0 rounded-b-2xl px-6 pb-5">
          <div className="flex items-end gap-4 -mt-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white text-lg font-bold text-white shadow-md" style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}>
              {initials}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-base font-bold text-zinc-900 leading-tight">{employee?.firstName} {employee?.lastName}</h1>
              <p className="text-xs text-zinc-500">{employee?.designation?.name ?? "—"}{employee?.department?.name ? ` · ${employee.department.name}` : ""}</p>
            </div>
            <div className="pb-1 hidden sm:flex items-center gap-6 text-right">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">ID</p>
                <p className="text-xs font-semibold text-zinc-700">{employee?.employeeId}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Type</p>
                <p className="text-xs font-semibold text-zinc-700">{employee?.employmentType?.replace("_", " ") ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Joined</p>
                <p className="text-xs font-semibold text-zinc-700">
                  {employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                ● {employee?.status ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly stat cards ─────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{MONTHS[now.getMonth()]} {now.getFullYear()} Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Present", value: presentCount, iconEl: <FontAwesomeIcon icon={faCheck} className="text-zinc-400 h-3.5 w-3.5" /> },
            { label: "Absent",  value: absentCount,  iconEl: <FontAwesomeIcon icon={faXmark} className="text-zinc-400 h-3.5 w-3.5" /> },
            { label: "Late",    value: lateCount,    iconEl: <FontAwesomeIcon icon={faClock} className="text-zinc-400 h-3.5 w-3.5" /> },
            { label: "On Leave",value: onLeaveCount, iconEl: <FontAwesomeIcon icon={faUmbrellaBeach} className="text-zinc-400 h-3.5 w-3.5" /> },
          ].map(({ label, value, iconEl }) => (
            <div key={label} className="rounded-xl border border-zinc-100 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-400">{label}</p>
                {iconEl}
              </div>
              <p className="text-2xl font-bold text-zinc-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content grid (left: attendance + leaves | right: sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT — col-span-2 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Today's attendance */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900">Today&apos;s Attendance</h2>
              <span className="text-xs text-zinc-400">{DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}</span>
            </div>
            <div className="flex items-stretch gap-3 mb-4 flex-wrap">
              {[
                { label: "Check In", value: todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null },
                { label: "Check Out", value: todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null },
                { label: "Hours", value: whStr },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 min-w-[90px] rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-base font-bold ${value ? "text-zinc-900" : "text-zinc-300"}`}>{value ?? "—"}</p>
                </div>
              ))}
              {todayRecord?.status && (
                <div className="flex-1 min-w-[90px] rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-1">Status</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    todayRecord.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                    todayRecord.status === "LATE" ? "bg-yellow-100 text-yellow-700" :
                    todayRecord.status === "ON_LEAVE" ? "bg-blue-100 text-blue-700" :
                    "bg-red-100 text-red-700"
                  }`}>{todayRecord.status.replace("_", " ")}</span>
                </div>
              )}
            </div>
            <AttendanceCheckIn
              hasCheckedIn={!!todayRecord?.checkIn}
              hasCheckedOut={!!todayRecord?.checkOut}
              checkInTime={todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null}
              checkOutTime={todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null}
              status={todayRecord?.status ?? null}
              workingHours={whStr}
            />
          </div>

          {/* Pending leave requests */}
          {leaves.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-900">Pending Leave Requests</h2>
                <Link href="/portal/leaves" className="text-xs font-medium text-[#29c0d5] hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {leaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{l.leaveType.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {l.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} → {l.endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {l.days} day{l.days !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">PENDING</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave balance */}
          {balances.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-900">Leave Balance {now.getFullYear()}</h2>
                <Link href="/portal/leaves" className="text-xs font-medium text-[#29c0d5] hover:underline">Apply →</Link>
              </div>
              <div className="space-y-3">
                {balances.map((lb) => {
                  const pct = lb.allocated > 0 ? Math.max(0, Math.min(100, (Number(lb.remaining) / Number(lb.allocated)) * 100)) : 0;
                  return (
                    <div key={lb.id}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-600 font-medium">{lb.leaveType.name}</span>
                        <span className="text-zinc-400">{String(lb.remaining)} / {String(lb.allocated)} days</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-100">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #29c0d5, #503d98)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT sidebar — col-span-1 */}
        <div className="space-y-5">

          {/* Latest notices */}
          {notices.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-900">Latest Notices</h2>
                <Link href="/portal/notices" className="text-xs font-medium text-[#29c0d5] hover:underline">View all →</Link>
              </div>
              <div className="space-y-3">
                {notices.map((n) => (
                  <Link key={n.id} href="/portal/notices" className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 hover:bg-zinc-100 transition-colors">
                    <span className={`mt-0.5 shrink-0 ${n.type === "URGENT" ? "text-red-500" : n.type === "EVENT" ? "text-[#503d98]" : n.type === "POLICY" ? "text-zinc-500" : n.type === "HR" ? "text-[#29c0d5]" : "text-zinc-400"}`}>
                      <FontAwesomeIcon icon={n.type === "URGENT" ? faTriangleExclamation : n.type === "EVENT" ? faCalendarDays : n.type === "POLICY" ? faFileLines : n.type === "HR" ? faUsers : faBullhorn} className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 leading-snug">{n.title}</p>
                      {n.content && <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{n.content}</p>}
                      <p className="text-[10px] text-zinc-400 mt-1">{n.publishedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming birthdays */}
          {upcomingBirthdays.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faCakeCandles} className="h-3.5 w-3.5 text-[#29c0d5]" />
                Upcoming Birthdays
              </h2>
              <div className="space-y-3">
                {upcomingBirthdays.map((e) => e && (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-pink-600 bg-pink-50 border border-pink-100 shrink-0">
                      {e.firstName[0]}{e.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900">{e.firstName} {e.lastName}</p>
                      <p className="text-[10px] text-zinc-400">{e.next.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</p>
                    </div>
                    <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 border flex items-center gap-1 ${e.daysLeft === 0 ? "bg-pink-50 border-pink-200 text-pink-600" : "bg-zinc-50 border-zinc-200 text-zinc-500"}`}>
                      {e.daysLeft === 0 ? <><FontAwesomeIcon icon={faStar} className="h-2.5 w-2.5" /> Today</> : `${e.daysLeft}d`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work anniversaries */}
          {upcomingAnniversaries.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faTrophy} className="h-3.5 w-3.5 text-[#503d98]" />
                Work Anniversaries
              </h2>
              <div className="space-y-3">
                {upcomingAnniversaries.map((e) => e && (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-purple-600 bg-purple-50 border border-purple-100 shrink-0">
                      {e.firstName[0]}{e.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900">{e.firstName} {e.lastName}</p>
                      <p className="text-[10px] text-zinc-400">{e.years} year{e.years !== 1 ? "s" : ""} · {e.next.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</p>
                    </div>
                    <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 border flex items-center gap-1 ${e.daysLeft === 0 ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-zinc-50 border-zinc-200 text-zinc-500"}`}>
                      {e.daysLeft === 0 ? <><FontAwesomeIcon icon={faStar} className="h-2.5 w-2.5" /> Today</> : `${e.daysLeft}d`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming holidays */}
          {upcomingHolidays.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Upcoming Holidays</h2>
              <div className="space-y-3">
                {upcomingHolidays.map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-purple-100 bg-purple-50">
                      <p className="text-[9px] font-bold text-purple-400 uppercase leading-none">{MONTHS[new Date(h.date).getMonth()]}</p>
                      <p className="text-sm font-bold text-purple-700 leading-none mt-0.5">{new Date(h.date).getDate()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{h.name}</p>
                      <p className="text-[10px] text-zinc-400">{DAYS[new Date(h.date).getDay()]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payslip requests */}
          {payslipRequests.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-900">Payslip Requests</h2>
                <Link href="/portal/payslip-request" className="text-xs font-medium text-[#29c0d5] hover:underline">New →</Link>
              </div>
              <div className="space-y-2">
                {payslipRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
                    <span className="text-xs font-medium text-zinc-700">{MONTHS[req.month - 1]} {req.year}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      req.status === "FULFILLED" ? "bg-emerald-100 text-emerald-700" :
                      req.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-zinc-200 text-zinc-500"
                    }`}>{req.status}</span>
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
