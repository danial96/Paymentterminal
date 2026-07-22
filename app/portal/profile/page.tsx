import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalChangePassword } from "@/app/actions/hrm-portal";
import { SubmitButton } from "@/app/components/SubmitButton";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-zinc-900 font-medium">{value || <span className="text-zinc-300 font-normal">—</span>}</p>
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

  const employee = await prisma.hRMEmployee.findUnique({
    where: { id: empId },
    include: { department: true, designation: true, shift: true },
  });

  if (!employee) return <p className="text-zinc-500">Employee not found.</p>;

  const initials = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase();

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
            <Field label="CNIC" value={employee.cnic} />
            <Field label="Passport" value={employee.passportNumber} />
          </Card>

          <Card title="Contact" cols={2}>
            <Field label="Phone" value={employee.phone} />
            <Field label="Personal Email" value={employee.personalEmail} />
            <Field label="Company Email" value={employee.companyEmail} />
            <Field label="LinkedIn" value={employee.linkedInUrl} />
            <div className="col-span-2">
              <Field label="Current Address" value={employee.currentAddress} />
            </div>
            <Field label="City" value={employee.city} />
            <Field label="Country" value={employee.country} />
          </Card>

          <Card title="Emergency Contact" cols={3}>
            <Field label="Name" value={employee.emergencyContactName} />
            <Field label="Relation" value={employee.emergencyContactRelation} />
            <Field label="Phone" value={employee.emergencyContact} />
          </Card>

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
