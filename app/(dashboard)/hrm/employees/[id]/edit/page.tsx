import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateEmployee } from "@/app/actions/hrm-employees";
import Link from "next/link";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const [emp, departments, designations, shifts, managers] = await Promise.all([
    prisma.hRMEmployee.findFirst({ where: { id: Number(id), deletedAt: null } }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMDesignation.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMShift.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMEmployee.findMany({ where: { deletedAt: null, status: "ACTIVE", NOT: { id: Number(id) } }, orderBy: { firstName: "asc" }, select: { id: true, firstName: true, lastName: true, employeeId: true } }),
  ]);
  if (!emp) notFound();

  const action = updateEmployee.bind(null, emp.id);
  const fmt = (d?: Date | null) => d ? d.toISOString().split("T")[0] : "";

  const fieldClass = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/hrm/employees/${emp.id}`} className="text-zinc-400 hover:text-zinc-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-zinc-900">Edit Employee — {emp.firstName} {emp.lastName}</h1>
      </div>

      <form action={action} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">First Name *</label><input name="firstName" required defaultValue={emp.firstName} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Last Name *</label><input name="lastName" required defaultValue={emp.lastName} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Father Name</label><input name="fatherName" defaultValue={emp.fatherName ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">CNIC</label><input name="cnic" defaultValue={emp.cnic ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Passport Number</label><input name="passportNumber" defaultValue={emp.passportNumber ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Date of Birth</label><input name="dateOfBirth" type="date" defaultValue={fmt(emp.dateOfBirth)} className={fieldClass} /></div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Gender</label>
              <select name="gender" defaultValue={emp.gender ?? ""} className={fieldClass}>
                <option value="">Select</option>
                <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Marital Status</label>
              <select name="maritalStatus" defaultValue={emp.maritalStatus ?? ""} className={fieldClass}>
                <option value="">Select</option>
                <option value="SINGLE">Single</option><option value="MARRIED">Married</option><option value="DIVORCED">Divorced</option><option value="WIDOWED">Widowed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Blood Group</label>
              <select name="bloodGroup" defaultValue={emp.bloodGroup ?? ""} className={fieldClass}>
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg}>{bg}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Nationality</label><input name="nationality" defaultValue={emp.nationality ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Religion</label><input name="religion" defaultValue={emp.religion ?? ""} className={fieldClass} /></div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Phone</label><input name="phone" defaultValue={emp.phone ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Personal Email</label><input name="personalEmail" type="email" defaultValue={emp.personalEmail ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Company Email</label><input name="companyEmail" type="email" defaultValue={emp.companyEmail ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Emergency Contact</label><input name="emergencyContact" defaultValue={emp.emergencyContact ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Emergency Name</label><input name="emergencyContactName" defaultValue={emp.emergencyContactName ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Relationship</label><input name="emergencyContactRelation" defaultValue={emp.emergencyContactRelation ?? ""} className={fieldClass} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-zinc-700 mb-1">Current Address</label><textarea name="currentAddress" rows={2} defaultValue={emp.currentAddress ?? ""} className={fieldClass} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-zinc-700 mb-1">Permanent Address</label><textarea name="permanentAddress" rows={2} defaultValue={emp.permanentAddress ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">City</label><input name="city" defaultValue={emp.city ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Country</label><input name="country" defaultValue={emp.country ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Postal Code</label><input name="postalCode" defaultValue={emp.postalCode ?? ""} className={fieldClass} /></div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Employment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Department</label>
              <select name="departmentId" defaultValue={emp.departmentId ?? ""} className={fieldClass}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Designation</label>
              <select name="designationId" defaultValue={emp.designationId ?? ""} className={fieldClass}>
                <option value="">Select</option>
                {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Reporting Manager</label>
              <select name="managerId" defaultValue={emp.managerId ?? ""} className={fieldClass}>
                <option value="">None</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.employeeId})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Shift</label>
              <select name="shiftId" defaultValue={emp.shiftId ?? ""} className={fieldClass}>
                <option value="">Select</option>
                {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Employment Type</label>
              <select name="employmentType" defaultValue={emp.employmentType} className={fieldClass}>
                <option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option><option value="INTERN">Intern</option><option value="FREELANCE">Freelance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Status</label>
              <select name="status" defaultValue={emp.status} className={fieldClass}>
                <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option><option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option><option value="RESIGNED">Resigned</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Joining Date</label><input name="joiningDate" type="date" defaultValue={fmt(emp.joiningDate)} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Confirmation Date</label><input name="confirmationDate" type="date" defaultValue={fmt(emp.confirmationDate)} className={fieldClass} /></div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Probation Status</label>
              <select name="probationStatus" defaultValue={emp.probationStatus} className={fieldClass}>
                <option value="ON_PROBATION">On Probation</option><option value="CONFIRMED">Confirmed</option><option value="EXTENDED">Extended</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Work Location</label><input name="workLocation" defaultValue={emp.workLocation ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Branch</label><input name="branch" defaultValue={emp.branch ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Office Floor</label><input name="officeFloor" defaultValue={emp.officeFloor ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Desk Number</label><input name="deskNumber" defaultValue={emp.deskNumber ?? ""} className={fieldClass} /></div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Financial Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Basic Salary</label><input name="basicSalary" type="number" step="0.01" defaultValue={emp.basicSalary ? String(emp.basicSalary) : ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Tax Number</label><input name="taxNumber" defaultValue={emp.taxNumber ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Bank Name</label><input name="bankName" defaultValue={emp.bankName ?? ""} className={fieldClass} /></div>
            <div><label className="block text-xs font-medium text-zinc-700 mb-1">Account Number</label><input name="accountNumber" defaultValue={emp.accountNumber ?? ""} className={fieldClass} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-zinc-700 mb-1">IBAN</label><input name="iban" defaultValue={emp.iban ?? ""} className={fieldClass} /></div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <label className="block text-xs font-medium text-zinc-700 mb-1">Notes</label>
          <textarea name="notes" rows={3} defaultValue={emp.notes ?? ""} className={fieldClass} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">Save Changes</button>
          <Link href={`/hrm/employees/${emp.id}`} className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
