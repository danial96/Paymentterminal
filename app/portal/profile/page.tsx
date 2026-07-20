import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalChangePassword } from "@/app/actions/hrm-portal";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 mb-0.5">{label}</p>
      <p className="text-sm text-zinc-900">{value || "—"}</p>
    </div>
  );
}

export default async function PortalProfilePage() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const employee = await prisma.hRMEmployee.findUnique({
    where: { id: empId },
    include: { department: true, designation: true },
  });

  if (!employee) {
    return <p className="text-zinc-500">Employee not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-zinc-900">My Profile</h1>

      {/* Personal info */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
          Personal Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" value={employee.firstName} />
          <Field label="Last Name" value={employee.lastName} />
          <Field label="Employee ID" value={employee.employeeId} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Personal Email" value={employee.personalEmail} />
          <Field label="Company Email" value={employee.companyEmail} />
          <Field label="Portal Email" value={employee.portalEmail} />
          <Field label="Department" value={employee.department?.name} />
          <Field label="Designation" value={employee.designation?.name} />
          <Field
            label="Joining Date"
            value={employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : undefined}
          />
          <Field label="Employment Type" value={employee.employmentType?.replace("_", " ")} />
          <Field label="Status" value={employee.status} />
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
          Change Portal Password
        </h2>
        <form action={portalChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">New Password</label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={6}
              className="w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg px-6 py-2 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
