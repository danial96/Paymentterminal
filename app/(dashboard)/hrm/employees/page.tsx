import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FingerprintSyncButton } from "./FingerprintSyncButton";
import GenerateLinkButton from "./GenerateLinkButton";
import ApproveButton from "./ApproveButton";
import { FilterForm } from "@/app/components/FilterForm";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-zinc-900 text-white",
  INACTIVE: "bg-zinc-100 text-zinc-500",
  ON_LEAVE: "bg-zinc-200 text-zinc-700",
  SUSPENDED: "bg-zinc-200 text-zinc-600",
  TERMINATED: "bg-zinc-200 text-zinc-600",
  RESIGNED: "bg-rose-100 text-rose-600",
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; status?: string }>;
}) {
  await requireUser();
  const { q, dept, status } = await searchParams;

  const employees = await prisma.hRMEmployee.findMany({
    where: {
      deletedAt: null,
      ...(q ? {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { employeeId: { contains: q } },
          { companyEmail: { contains: q } },
        ],
      } : {}),
      ...(dept ? { departmentId: Number(dept) } : {}),
      ...(status ? { status: status as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED" | "RESIGNED" } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { department: true, designation: true, shift: true },
  });

  const [departments, pendingEmployees] = await Promise.all([
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.hRMEmployee.findMany({ where: { status: "INACTIVE", deletedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Employees</h1>
          <p className="text-sm text-zinc-500">{employees.length} employee{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
<GenerateLinkButton />
          <Link href="/hrm/employees/new" className="btn-brand rounded-lg px-4 py-2 text-sm font-medium text-white">
            + Add Employee
          </Link>
        </div>
      </div>

      {/* Filters */}
      <FilterForm action="/hrm/employees" className="flex gap-2 flex-wrap items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, ID, email…"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 w-56"
        />
        <select name="dept" defaultValue={dept} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select name="status" defaultValue={status} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
          <option value="">All Status</option>
          {["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED"].map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <button type="submit" className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white">Filter</button>
        {(q || dept || status) && (
          <Link href="/hrm/employees" className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Clear</Link>
        )}
      </FilterForm>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Designation</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Fingerprint</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {employees.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-400">No employees found</td>
              </tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-700 shrink-0">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-zinc-400">{emp.companyEmail || emp.personalEmail || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-600">{emp.employeeId}</td>
                <td className="px-4 py-3 text-zinc-600">{emp.department?.name ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{emp.designation?.name ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{emp.employmentType.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[emp.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {emp.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <FingerprintSyncButton enrolled={emp.fingerprintEnrolled} />
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {emp.joiningDate ? emp.joiningDate.toLocaleDateString("en-GB") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/hrm/employees/${emp.id}`} className="text-zinc-700 hover:text-zinc-800 text-xs font-medium">View</Link>
                    <Link href={`/hrm/payroll/generate?emp=${emp.id}`} className="text-zinc-700 hover:text-zinc-800 text-xs font-medium">Payslip</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pendingEmployees.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Pending Approval</h2>
            <p className="text-xs text-zinc-500">{pendingEmployees.length} employee{pendingEmployees.length !== 1 ? "s" : ""} registered via self-registration link, awaiting HR approval</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">CNIC</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Registered</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pendingEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-zinc-400">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-xs">{emp.phone || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 text-xs font-mono">{emp.cnic || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 text-xs">{emp.personalEmail || "—"}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{emp.createdAt.toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/hrm/employees/${emp.id}`} className="text-zinc-500 hover:text-zinc-700 text-xs font-medium">View</Link>
                        <ApproveButton employeeId={emp.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
