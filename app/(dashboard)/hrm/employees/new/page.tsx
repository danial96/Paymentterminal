import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createEmployee } from "@/app/actions/hrm-employees";
import Link from "next/link";

export default async function NewEmployeePage() {
  await requireUser();
  const [departments, designations, shifts] = await Promise.all([
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMDesignation.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMShift.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/hrm/employees" className="text-zinc-400 hover:text-zinc-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-zinc-900">Add New Employee</h1>
      </div>

      <form action={createEmployee} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">First Name *</label>
              <input name="firstName" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Last Name *</label>
              <input name="lastName" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Father Name</label>
              <input name="fatherName" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">CNIC / National ID</label>
              <input name="cnic" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Passport Number</label>
              <input name="passportNumber" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Date of Birth</label>
              <input name="dateOfBirth" type="date" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Gender</label>
              <select name="gender" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Marital Status</label>
              <select name="maritalStatus" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Blood Group</label>
              <select name="bloodGroup" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Phone</label>
              <input name="phone" type="tel" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Personal Email</label>
              <input name="personalEmail" type="email" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Company Email</label>
              <input name="companyEmail" type="email" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">LinkedIn Profile URL</label>
              <input name="linkedInUrl" type="url" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="https://linkedin.com/in/name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Emergency Contact</label>
              <input name="emergencyContact" type="tel" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Emergency Contact Name</label>
              <input name="emergencyContactName" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Relationship</label>
              <input name="emergencyContactRelation" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="e.g. Spouse, Parent" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Current Address</label>
              <textarea name="currentAddress" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Permanent Address</label>
              <textarea name="permanentAddress" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">City</label>
              <input name="city" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Country</label>
              <input name="country" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Postal Code</label>
              <input name="postalCode" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Employment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Department</label>
              <select name="departmentId" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Designation</label>
              <select name="designationId" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select Designation</option>
                {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Shift</label>
              <select name="shiftId" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select Shift</option>
                {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Employment Type</label>
              <select name="employmentType" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Status</label>
              <select name="status" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Joining Date</label>
              <input name="joiningDate" type="date" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Confirmation Date</label>
              <input name="confirmationDate" type="date" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Probation Status</label>
              <select name="probationStatus" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
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
              <label className="block text-xs font-medium text-zinc-700 mb-1">Basic Salary</label>
              <input name="basicSalary" type="number" step="0.01" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Tax Number</label>
              <input name="taxNumber" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Bank Name</label>
              <input name="bankName" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Account Number</label>
              <input name="accountNumber" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">IBAN</label>
              <input name="iban" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <label className="block text-xs font-medium text-zinc-700 mb-1">Notes</label>
          <textarea name="notes" rows={3} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-brand rounded-lg px-6 py-2.5 text-sm font-medium text-white">
            Create Employee
          </button>
          <Link href="/hrm/employees" className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
