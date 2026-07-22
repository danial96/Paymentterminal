export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalChangePassword } from "@/app/actions/hrm-portal";
import RequestUpdateForm from "./RequestUpdateForm";
import CancelRequestButton from "./CancelRequestButton";
import { SubmitButton } from "@/app/components/SubmitButton";

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  APPROVED:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED:  "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

function Field({ label, value, fieldKey, pendingValue }: {
  label: string; value?: string | null; fieldKey?: string; pendingValue?: string | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-zinc-900 font-medium">
        {value || <span className="text-zinc-300 font-normal">—</span>}
      </p>
      {pendingValue && (
        <p className="text-[10px] text-yellow-600 mt-0.5">Pending: {pendingValue}</p>
      )}
    </div>
  );
}

function Card({ title, children, cols = 2 }: { title: string; children: React.ReactNode; cols?: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">{title}</h2>
      <div className={`grid gap-4 ${cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
        {children}
      </div>
    </div>
  );
}

export default async function PortalProfilePage() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const [employee, requests] = await Promise.all([
    prisma.hRMEmployee.findUnique({
      where: { id: empId },
      include: { department: true, designation: true, shift: true },
    }),
    (prisma as any).hRMProfileUpdateRequest.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!employee) return <p className="text-zinc-500">Employee not found.</p>;

  const initials = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase();

  // Build pending map: fieldKey → requestedValue
  const pendingMap: Record<string, string> = {};
  for (const r of requests) {
    if (r.status === "PENDING") pendingMap[r.fieldKey] = r.requestedValue;
  }

  const pendingRequests = requests.filter((r: any) => r.status === "PENDING");
  const recentRequests = requests.filter((r: any) => r.status !== "PENDING").slice(0, 5);

  return (
    <div className="space-y-5">

      {/* ── Profile banner ── */}
      <div className="rounded-2xl overflow-hidden">
        <div className="h-24 w-full" style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }} />
        <div className="bg-white border border-zinc-200 border-t-0 rounded-b-2xl px-6 pb-6">
          <div className="flex items-end gap-5 -mt-10 flex-wrap">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white text-2xl font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
            >
              {initials}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-xl font-bold text-zinc-900 leading-tight">{employee.firstName} {employee.lastName}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {employee.designation?.name ?? "—"}
                {employee.department?.name ? ` · ${employee.department.name}` : ""}
              </p>
            </div>
            <div className="pb-1 flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">ID</p>
                <p className="text-sm font-bold text-zinc-700">{employee.employeeId}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Type</p>
                <p className="text-sm font-bold text-zinc-700">{employee.employmentType?.replace("_", " ") ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Joined</p>
                <p className="text-sm font-bold text-zinc-700">
                  {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                employee.status === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-zinc-100 border-zinc-200 text-zinc-500"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${employee.status === "ACTIVE" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                {employee.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending requests banner ── */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-xs font-semibold text-yellow-800 mb-2">
            {pendingRequests.length} update request{pendingRequests.length > 1 ? "s" : ""} pending HR approval
          </p>
          <div className="space-y-1.5">
            {pendingRequests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-3 bg-white rounded-lg border border-yellow-100 px-3 py-2">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-zinc-700">{r.fieldLabel}</span>
                  <span className="text-xs text-zinc-400 mx-1.5">→</span>
                  <span className="text-xs text-zinc-900">{r.requestedValue}</span>
                </div>
                <CancelRequestButton id={r.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          <Card title="Personal Information" cols={2}>
            <Field label="First Name" value={employee.firstName} />
            <Field label="Last Name" value={employee.lastName} />
            <Field label="Father Name" value={employee.fatherName} />
            <Field label="Gender" value={employee.gender} />
            <Field label="Date of Birth" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString("en-GB") : null} />
            <Field label="Marital Status" value={employee.maritalStatus?.replace("_", " ")} />
            <Field label="Blood Group" value={employee.bloodGroup} />
            <Field label="Nationality" value={employee.nationality} />
            <Field label="CNIC" value={employee.cnic} fieldKey="cnic" pendingValue={pendingMap["cnic"]} />
          </Card>

          <Card title="Contact" cols={2}>
            <Field label="Phone" value={employee.phone} fieldKey="phone" pendingValue={pendingMap["phone"]} />
            <Field label="Personal Email" value={employee.personalEmail} fieldKey="personalEmail" pendingValue={pendingMap["personalEmail"]} />
            <Field label="Company Email" value={employee.companyEmail} />
            <Field label="LinkedIn" value={employee.linkedInUrl} fieldKey="linkedInUrl" pendingValue={pendingMap["linkedInUrl"]} />
            <div className="col-span-2">
              <Field label="Current Address" value={employee.currentAddress} fieldKey="currentAddress" pendingValue={pendingMap["currentAddress"]} />
            </div>
            <Field label="City" value={employee.city} fieldKey="city" pendingValue={pendingMap["city"]} />
            <Field label="Country" value={employee.country} fieldKey="country" pendingValue={pendingMap["country"]} />
          </Card>

          <Card title="Emergency Contact" cols={3}>
            <Field label="Name" value={employee.emergencyContactName} fieldKey="emergencyContactName" pendingValue={pendingMap["emergencyContactName"]} />
            <Field label="Relation" value={employee.emergencyContactRelation} fieldKey="emergencyContactRelation" pendingValue={pendingMap["emergencyContactRelation"]} />
            <Field label="Phone" value={employee.emergencyContact} fieldKey="emergencyContact" pendingValue={pendingMap["emergencyContact"]} />
          </Card>

          {/* Recent request history */}
          {recentRequests.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Update History</h2>
              <div className="space-y-2">
                {recentRequests.map((r: any) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-700">{r.fieldLabel}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {r.currentValue || "—"} → {r.requestedValue}
                      </p>
                      {r.hrNote && <p className="text-[10px] text-zinc-400 mt-0.5">HR: {r.hrNote}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[r.status] ?? STATUS_BADGE.CANCELLED}`}>
                        {r.status}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          <Card title="Employment" cols={2}>
            <Field label="Employee ID" value={employee.employeeId} />
            <Field label="Department" value={employee.department?.name} />
            <Field label="Designation" value={employee.designation?.name} />
            <Field label="Shift" value={employee.shift?.name} />
            <Field label="Work Location" value={employee.workLocation} />
            <Field label="Branch" value={employee.branch} />
          </Card>

          <Card title="Bank Details" cols={2}>
            <div className="col-span-2"><Field label="Account Title" value={employee.bankAccountName} /></div>
            <Field label="Bank Name" value={employee.bankName} />
            <Field label="Account Number" value={employee.accountNumber} />
            <div className="col-span-2"><Field label="IBAN" value={employee.iban} /></div>
          </Card>

          <RequestUpdateForm />

          {/* Change password */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Change Password</h2>
            <form action={portalChangePassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29c0d5]/40"
                  placeholder="At least 6 characters"
                />
              </div>
              <SubmitButton
                className="w-full rounded-lg py-2 text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
                pendingText="Updating..."
              >
                Update Password
              </SubmitButton>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
