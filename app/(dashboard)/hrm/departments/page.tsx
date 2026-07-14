import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createDepartment, updateDepartment, deleteDepartment } from "@/app/actions/hrm-departments";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";

export default async function DepartmentsPage() {
  await requireUser();
  const [departments, employees] = await Promise.all([
    prisma.hRMDepartment.findMany({ orderBy: { name: "asc" }, include: { head: true, _count: { select: { employees: true } } } }),
    prisma.hRMEmployee.findMany({ where: { deletedAt: null, status: "ACTIVE" }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Departments</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Add Form */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Add Department</h2>
          <form action={createDepartment} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Department Name *</label>
              <input name="name" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Code</label>
              <input name="code" placeholder="e.g. ENG, HR, FIN" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Department Head</label>
              <select name="headId" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Head</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
              <textarea name="description" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add Department</button>
          </form>
        </div>

        {/* List */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">All Departments ({departments.length})</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {departments.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-400">No departments yet</p>}
            {departments.map((dept) => (
              <div key={dept.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900">{dept.name}</p>
                    {dept.code && <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-zinc-100 text-zinc-500">{dept.code}</span>}
                    {!dept.isActive && <span className="rounded-full px-2 py-0.5 text-[10px] bg-red-100 text-red-500">Inactive</span>}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {dept._count.employees} employee{dept._count.employees !== 1 ? "s" : ""}
                    {dept.head ? ` · Head: ${dept.head.firstName} ${dept.head.lastName}` : ""}
                  </p>
                </div>
                <form action={deleteDepartment.bind(null, dept.id)}>
                  <DeleteButton className="text-xs text-red-500 hover:text-red-700 px-2" message="Delete this department?" />
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
