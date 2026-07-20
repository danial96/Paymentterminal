import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { updateEmployee } from "@/app/actions/hrm-employees";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const empId = Number(id);
  if (isNaN(empId)) notFound();

  const [employee, departments, designations, shifts] = await Promise.all([
    prisma.hRMEmployee.findUnique({ where: { id: empId } }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMDesignation.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMShift.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!employee) notFound();

  const fmt = (d: Date | null) => d ? new Date(d).toISOString().split("T")[0] : "";
  const action = updateEmployee.bind(null, empId);

  const inp = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";
  const lbl = "block text-xs font-medium text-zinc-700 mb-1";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/hrm/employees/${empId}`} className="text-zinc-400 hover:text-zinc-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-zinc-900">Edit Employee — {employee.firstName} {employee.lastName}</h1>
      </div>

      <form action={action} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>First Name *</label>
              <input name="firstName" required defaultValue={employee.firstName} className={inp} />
            </div>
            <div>
              <label className={lbl}>Last Name *</label>
              <input name="lastName" required defaultValue={employee.lastName} className={inp} />
            </div>
            <div>
              <label className={lbl}>Father Name</label>
              <input name="fatherName" defaultValue={employee.fatherName ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>CNIC / National ID</label>
              <input name="cnic" defaultValue={employee.cnic ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Passport Number</label>
              <input name="passportNumber" defaultValue={employee.passportNumber ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Date of Birth</label>
              <input name="dateOfBirth" type="date" defaultValue={fmt(employee.dateOfBirth)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Gender</label>
              <select name="gender" defaultValue={employee.gender ?? ""} className={inp}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Marital Status</label>
              <select name="maritalStatus" defaultValue={employee.maritalStatus ?? ""} className={inp}>
                <option value="">Select</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Blood Group</label>
              <select name="bloodGroup" defaultValue={employee.bloodGroup ?? ""} className={inp}>
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Nationality</label>
              <input name="nationality" defaultValue={employee.nationality ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Religion</label>
              <input name="religion" defaultValue={employee.religion ?? ""} className={inp} />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Phone</label>
              <input name="phone" type="tel" defaultValue={employee.phone ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Personal Email</label>
              <input name="personalEmail" type="email" defaultValue={employee.personalEmail ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Company Email</label>
              <input name="companyEmail" type="email" defaultValue={employee.companyEmail ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>LinkedIn Profile URL</label>
              <input name="linkedInUrl" type="url" defaultValue={(employee as any).linkedInUrl ?? ""} className={inp} placeholder="https://linkedin.com/in/name" />
            </div>
            <div>
              <label className={lbl}>Emergency Contact</label>
              <input name="emergencyContact" type="tel" defaultValue={employee.emergencyContact ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Emergency Contact Name</label>
              <input name="emergencyContactName" defaultValue={employee.emergencyContactName ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Relationship</label>
              <input name="emergencyContactRelation" defaultValue={employee.emergencyContactRelation ?? ""} className={inp} placeholder="e.g. Spouse, Parent" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lbl}>Current Address</label>
              <textarea name="currentAddress" rows={2} defaultValue={employee.currentAddress ?? ""} className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Permanent Address</label>
              <textarea name="permanentAddress" rows={2} defaultValue={employee.permanentAddress ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>City</label>
              <input name="city" defaultValue={employee.city ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Country</label>
              <input name="country" defaultValue={employee.country ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Postal Code</label>
              <input name="postalCode" defaultValue={employee.postalCode ?? ""} className={inp} />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Employment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Department</label>
              <select name="departmentId" defaultValue={employee.departmentId ?? ""} className={inp}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Designation</label>
              <select name="designationId" defaultValue={employee.designationId ?? ""} className={inp}>
                <option value="">Select Designation</option>
                {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Shift</label>
              <select name="shiftId" defaultValue={employee.shiftId ?? ""} className={inp}>
                <option value="">Select Shift</option>
                {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Employment Type</label>
              <select name="employmentType" defaultValue={employee.employmentType} className={inp}>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select name="status" defaultValue={employee.status} className={inp}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Joining Date</label>
              <input name="joiningDate" type="date" defaultValue={fmt(employee.joiningDate)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Confirmation Date</label>
              <input name="confirmationDate" type="date" defaultValue={fmt(employee.confirmationDate)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Probation Status</label>
              <select name="probationStatus" defaultValue={employee.probationStatus ?? "ON_PROBATION"} className={inp}>
                <option value="ON_PROBATION">On Probation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="EXTENDED">Extended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Financial Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Basic Salary</label>
              <input name="basicSalary" type="number" step="0.01" defaultValue={employee.basicSalary?.toString() ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Tax Number</label>
              <input name="taxNumber" defaultValue={employee.taxNumber ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Bank Name</label>
              <input name="bankName" defaultValue={employee.bankName ?? ""} className={inp} />
            </div>
            <div>
              <label className={lbl}>Account Number</label>
              <input name="accountNumber" defaultValue={employee.accountNumber ?? ""} className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>IBAN</label>
              <input name="iban" defaultValue={employee.iban ?? ""} className={inp} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <label className={lbl}>Notes</label>
          <textarea name="notes" rows={3} defaultValue={employee.notes ?? ""} className={inp} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-brand rounded-lg px-6 py-2.5 text-sm font-medium text-white">
            Save Changes
          </button>
          <Link href={`/hrm/employees/${empId}`} className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
