import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createDesignation, deleteDesignation } from "@/app/actions/hrm-departments";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";

export default async function DesignationsPage() {
  await requireUser();
  const [designations, departments] = await Promise.all([
    prisma.hRMDesignation.findMany({ orderBy: { name: "asc" }, include: { department: true, _count: { select: { employees: true } } } }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Designations</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Add Designation</h2>
          <form action={createDesignation} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Designation Name *</label>
              <input name="name" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Department</label>
              <select name="departmentId" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Salary Grade</label>
              <input name="salaryGrade" placeholder="e.g. G1, G2, Senior" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
              <textarea name="description" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add Designation</button>
          </form>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">All Designations ({designations.length})</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {designations.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-400">No designations yet</p>}
            {designations.map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">{d.name}</p>
                  <p className="text-xs text-zinc-400">
                    {d.department?.name ?? "No Department"}
                    {d.salaryGrade ? ` · Grade: ${d.salaryGrade}` : ""}
                    {` · ${d._count.employees} employee${d._count.employees !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <form action={deleteDesignation.bind(null, d.id)}>
                  <DeleteButton className="text-xs text-red-500 hover:text-red-700 px-2" message="Delete this designation?" />
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
