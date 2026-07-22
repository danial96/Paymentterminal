import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteEmployee } from "@/app/actions/hrm-employees";
import ProfileRequestActions from "./ProfileRequestActions";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";
import { EnrollFingerprintButton } from "./EnrollFingerprintButton";
import PortalAccessCard from "./PortalAccessCard";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-zinc-100 text-zinc-500",
  ON_LEAVE: "bg-blue-100 text-blue-600",
  SUSPENDED: "bg-orange-100 text-orange-600",
  TERMINATED: "bg-red-100 text-red-600",
  RESIGNED: "bg-rose-100 text-rose-600",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-zinc-400 font-medium">{label}</dt>
      <dd className="text-sm text-zinc-800 mt-0.5">{value || "—"}</dd>
    </div>
  );
}

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const empId = Number(id);
  const [emp, bankAccounts, profileRequests] = await Promise.all([
    prisma.hRMEmployee.findFirst({
    where: { id: empId, deletedAt: null },
    include: {
      department: true,
      designation: true,
      manager: true,
      shift: true,
      user: { select: { id: true, email: true, role: true } },
      attendance: { orderBy: { date: "desc" }, take: 10 },
      leaves: { orderBy: { createdAt: "desc" }, take: 5, include: { leaveType: true } },
      payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 6 },
      assets: { where: { status: "ASSIGNED" } },
      documents: { orderBy: { createdAt: "desc" }, take: 5 },
      performances: { orderBy: { createdAt: "desc" }, take: 3 },
      allowances: { where: { isActive: true } },
      deductions: { where: { isActive: true } },
    },
  }),
    (prisma as any).hRMEmployeeBankAccount.findMany({ where: { employeeId: empId }, orderBy: { createdAt: "asc" } }),
    (prisma as any).hRMProfileUpdateRequest.findMany({ where: { employeeId: empId, status: "PENDING" }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!emp) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = emp.attendance.find((a) => a.date.getTime() === today.getTime());

  const deleteAction = deleteEmployee.bind(null, emp.id);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/hrm/employees" className="text-zinc-400 hover:text-zinc-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-900">{emp.firstName} {emp.lastName}</h1>
          <p className="text-sm text-zinc-500">{emp.employeeId} · {emp.designation?.name ?? "—"} · {emp.department?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[emp.status] ?? "bg-zinc-100 text-zinc-500"}`}>
            {emp.status.replace("_", " ")}
          </span>
          {emp.fingerprintEnrolled ? (
            <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-700">
              ✓ Fingerprint Enrolled
            </span>
          ) : (
            <span className="rounded-full px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700">
              ⏳ Fingerprint Pending
            </span>
          )}
          <EnrollFingerprintButton employeeId={emp.employeeId} dbId={emp.id} enrolled={emp.fingerprintEnrolled} />
          <Link href={`/hrm/employees/${emp.id}/edit`} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">Edit</Link>
          <form action={deleteAction}>
            <DeleteButton className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" message="Delete this employee permanently?">
              Delete
            </DeleteButton>
          </form>
        </div>
      </div>

      {/* Today's Attendance Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center gap-6">
        <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700 shrink-0">
          {emp.firstName[0]}{emp.lastName[0]}
        </div>
        <div className="flex-1 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-zinc-400">Today Check In</p>
            <p className="text-sm font-semibold text-zinc-900">
              {todayAttendance?.checkIn ? todayAttendance.checkIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Today Check Out</p>
            <p className="text-sm font-semibold text-zinc-900">
              {todayAttendance?.checkOut ? todayAttendance.checkOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Working Hours</p>
            <p className="text-sm font-semibold text-zinc-900">{todayAttendance?.workingHours ? `${Number(todayAttendance.workingHours).toFixed(1)}h` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Today Status</p>
            <p className="text-sm font-semibold text-zinc-900">{todayAttendance?.status ?? "Not Recorded"}</p>
          </div>
        </div>
      </div>

      {/* System Login Card */}
      {emp.user && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">System Login Account</p>
            <p className="text-sm text-indigo-700 mt-0.5">
              Email: <strong>{emp.user.email}</strong> &nbsp;·&nbsp; Role: <strong>{emp.user.role.replace(/_/g, " ")}</strong>
            </p>
            <p className="text-[11px] text-indigo-500 mt-0.5">Default password is the Employee ID: <strong>{emp.employeeId}</strong> — ask employee to change it after first login.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Profile Info */}
        <div className="col-span-2 space-y-4">
          {/* Personal */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Personal Information</h2>
            <dl className="grid grid-cols-3 gap-4">
              <InfoRow label="Father Name" value={emp.fatherName} />
              <InfoRow label="CNIC" value={emp.cnic} />
              <InfoRow label="Date of Birth" value={emp.dateOfBirth?.toLocaleDateString("en-GB")} />
              <InfoRow label="Gender" value={emp.gender ?? undefined} />
              <InfoRow label="Marital Status" value={emp.maritalStatus ?? undefined} />
              <InfoRow label="Blood Group" value={emp.bloodGroup} />
              <InfoRow label="Nationality" value={emp.nationality} />
              <InfoRow label="Religion" value={emp.religion} />
            </dl>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Contact Information</h2>
            <dl className="grid grid-cols-3 gap-4">
              <InfoRow label="Phone" value={emp.phone} />
              <InfoRow label="Personal Email" value={emp.personalEmail} />
              <InfoRow label="Company Email" value={emp.companyEmail} />
              <InfoRow label="Emergency Contact" value={emp.emergencyContact} />
              <InfoRow label="Emergency Name" value={emp.emergencyContactName} />
              <InfoRow label="Relationship" value={emp.emergencyContactRelation} />
              <div className="col-span-3">
                <InfoRow label="Current Address" value={emp.currentAddress} />
              </div>
              <div className="col-span-3">
                <InfoRow label="Permanent Address" value={emp.permanentAddress} />
              </div>
              <InfoRow label="City" value={emp.city} />
              <InfoRow label="Country" value={emp.country} />
              <InfoRow label="Postal Code" value={emp.postalCode} />
            </dl>
          </div>

          {/* Employment */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Employment Details</h2>
            <dl className="grid grid-cols-3 gap-4">
              <InfoRow label="Department" value={emp.department?.name} />
              <InfoRow label="Designation" value={emp.designation?.name} />
              <InfoRow label="Reporting Manager" value={emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : undefined} />
              <InfoRow label="Employment Type" value={emp.employmentType.replace("_", " ")} />
              <InfoRow label="Joining Date" value={emp.joiningDate?.toLocaleDateString("en-GB")} />
              <InfoRow label="Confirmation Date" value={emp.confirmationDate?.toLocaleDateString("en-GB")} />
              <InfoRow label="Probation Status" value={emp.probationStatus.replace("_", " ")} />
              <InfoRow label="Shift" value={emp.shift ? ((emp.shift.shiftType as string) === "REMOTE" ? emp.shift.name : `${emp.shift.name} (${emp.shift.startTime}–${emp.shift.endTime})`) : undefined} />
              <InfoRow label="Work Location" value={emp.workLocation} />
              <InfoRow label="Branch" value={emp.branch} />
              <InfoRow label="Floor / Desk" value={[emp.officeFloor, emp.deskNumber].filter(Boolean).join(" / ") || undefined} />
            </dl>
          </div>

          {/* Financial */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Financial Information</h2>
            <dl className="grid grid-cols-3 gap-4 mb-4">
              <InfoRow label="Basic Salary" value={emp.basicSalary ? `PKR ${Number(emp.basicSalary).toLocaleString()}` : undefined} />
              <InfoRow label="Tax Number" value={emp.taxNumber} />
            </dl>
            {bankAccounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Bank Accounts</p>
                {bankAccounts.map((acc: any) => (
                  <div key={acc.id} className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-zinc-900">{acc.accountTitle}</p>
                      {acc.isDefault && <span className="rounded-full bg-[#29c0d5]/10 px-2 py-0.5 text-[10px] font-semibold text-[#29c0d5]">Default</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-zinc-600">
                      {acc.bankName && <span><span className="text-zinc-400">Bank: </span>{acc.bankName}</span>}
                      {acc.accountNumber && <span><span className="text-zinc-400">Account: </span>{acc.accountNumber}</span>}
                      {acc.iban && <span><span className="text-zinc-400">IBAN: </span>{acc.iban}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(emp.allowances.length > 0 || emp.deductions.length > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {emp.allowances.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">Allowances</p>
                    {emp.allowances.map((a) => (
                      <div key={a.id} className="flex justify-between text-xs py-1">
                        <span className="text-zinc-600">{a.name}</span>
                        <span className="font-medium text-emerald-600">+{Number(a.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                {emp.deductions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">Deductions</p>
                    {emp.deductions.map((d) => (
                      <div key={d.id} className="flex justify-between text-xs py-1">
                        <span className="text-zinc-600">{d.name}</span>
                        <span className="font-medium text-red-500">-{Number(d.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick panels */}
        <div className="space-y-4">
          {/* Portal Access */}
          <PortalAccessCard
            employeeId={emp.id}
            portalEnabled={emp.portalEnabled ?? false}
            portalEmail={emp.portalEmail}
          />

          {/* Recent Attendance */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Recent Attendance</h2>
              <Link href={`/hrm/attendance?emp=${emp.id}`} className="text-xs text-indigo-600">View all</Link>
            </div>
            <div className="divide-y divide-zinc-50">
              {emp.attendance.slice(0, 7).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-zinc-600">{a.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                    a.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                    a.status === "ABSENT" ? "bg-red-100 text-red-600" :
                    a.status === "LATE" ? "bg-orange-100 text-orange-600" :
                    a.status === "ON_LEAVE" ? "bg-blue-100 text-blue-600" :
                    "bg-zinc-100 text-zinc-500"
                  }`}>{a.status.replace("_", " ")}</span>
                  <span className="text-xs text-zinc-400">{a.workingHours ? `${Number(a.workingHours).toFixed(1)}h` : "—"}</span>
                </div>
              ))}
              {emp.attendance.length === 0 && <p className="px-4 py-4 text-xs text-zinc-400 text-center">No records</p>}
            </div>
          </div>

          {/* Leave History */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Leave History</h2>
              <Link href={`/hrm/leaves?emp=${emp.id}`} className="text-xs text-indigo-600">View all</Link>
            </div>
            <div className="divide-y divide-zinc-50">
              {emp.leaves.map((l) => (
                <div key={l.id} className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800">{l.leaveType.name}</span>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                      l.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                      l.status === "PENDING" ? "bg-amber-100 text-amber-600" :
                      "bg-red-100 text-red-500"
                    }`}>{l.status}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">{l.days} day{l.days !== 1 ? "s" : ""} · {l.startDate.toLocaleDateString("en-GB")}</p>
                </div>
              ))}
              {emp.leaves.length === 0 && <p className="px-4 py-4 text-xs text-zinc-400 text-center">No leaves</p>}
            </div>
          </div>

          {/* Payroll Summary */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Payroll</h2>
              <div className="flex items-center gap-3">
                <Link href={`/hrm/payroll/generate?emp=${emp.id}`} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">+ Generate Payslip</Link>
                <Link href={`/hrm/payroll?emp=${emp.id}`} className="text-xs text-indigo-600">View all</Link>
              </div>
            </div>
            <div className="divide-y divide-zinc-50">
              {emp.payrolls.map((p) => (
                <Link key={p.id} href={`/hrm/payroll/${p.id}`} className="flex items-center justify-between px-4 py-2 hover:bg-zinc-50">
                  <span className="text-xs text-zinc-600">{monthNames[p.month - 1]} {p.year}</span>
                  <span className="text-xs font-semibold text-zinc-900">{Number(p.netSalary).toLocaleString()}</span>
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                    p.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                    p.status === "APPROVED" ? "bg-blue-100 text-blue-600" :
                    "bg-zinc-100 text-zinc-500"
                  }`}>{p.status}</span>
                </Link>
              ))}
              {emp.payrolls.length === 0 && <p className="px-4 py-4 text-xs text-zinc-400 text-center">No payroll records</p>}
            </div>
          </div>

          {/* Assets */}
          {emp.assets.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Assigned Assets</h2>
              </div>
              <div className="divide-y divide-zinc-50">
                {emp.assets.map((a) => (
                  <div key={a.id} className="px-4 py-2">
                    <p className="text-xs font-medium text-zinc-800">{a.name}</p>
                    <p className="text-[10px] text-zinc-400">{a.type} · {a.assetCode ?? "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance */}
          {emp.performances.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Performance</h2>
              </div>
              <div className="divide-y divide-zinc-50">
                {emp.performances.map((p) => (
                  <div key={p.id} className="px-4 py-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium text-zinc-800">{p.reviewPeriod}</span>
                      <span className="text-xs">{"⭐".repeat(p.rating)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">{p.reviewType}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profileRequests.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-amber-800">Profile Update Requests</h2>
                <span className="rounded-full bg-amber-200 text-amber-800 px-2 py-0.5 text-[10px] font-bold">{profileRequests.length}</span>
              </div>
              <div className="divide-y divide-amber-100">
                {profileRequests.map((r: any) => (
                  <div key={r.id} className="p-3">
                    <ProfileRequestActions
                      requestId={r.id}
                      employeeId={empId}
                      fieldLabel={r.fieldLabel}
                      currentValue={r.currentValue}
                      requestedValue={r.requestedValue}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {emp.notes && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-zinc-500 mb-1">Notes</p>
              <p className="text-sm text-zinc-700">{emp.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
