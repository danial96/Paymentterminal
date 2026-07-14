import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createAsset, deleteAsset } from "@/app/actions/hrm-assets";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  ASSIGNED: "bg-blue-100 text-blue-600",
  MAINTENANCE: "bg-orange-100 text-orange-600",
  RETIRED: "bg-zinc-100 text-zinc-400",
};

const ASSET_TYPES = ["Laptop", "Desktop", "Monitor", "Mobile", "Keyboard", "Mouse", "Vehicle", "SIM Card", "Access Card", "Printer", "UPS", "Other"];

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  await requireUser();
  const { status, type } = await searchParams;

  const [assets, employees] = await Promise.all([
    prisma.hRMAsset.findMany({
      where: {
        ...(status ? { status: status as "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED" } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    }),
    prisma.hRMEmployee.findMany({ where: { deletedAt: null, status: "ACTIVE" }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
  ]);

  const available = assets.filter((a) => a.status === "AVAILABLE").length;
  const assigned = assets.filter((a) => a.status === "ASSIGNED").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Company Assets</h1>
        <div className="flex gap-4 text-sm">
          <span className="text-zinc-500">{assets.length} total · <span className="text-emerald-600">{available} available</span> · <span className="text-blue-600">{assigned} assigned</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Add Asset Form */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Add Asset</h2>
          <form action={createAsset} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Asset Name *</label>
              <input name="name" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Type *</label>
              <select name="type" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Type</option>
                {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Asset Code</label>
                <input name="assetCode" placeholder="AST-001" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Serial No.</label>
                <input name="serialNumber" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Brand</label>
              <input name="brand" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Condition</label>
              <select name="condition" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Assign To</label>
              <select name="employeeId" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Unassigned</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Status</label>
              <select name="status" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Issue Date</label>
                <input name="issueDate" type="date" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Return Date</label>
                <input name="returnDate" type="date" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add Asset</button>
          </form>
        </div>

        {/* Asset Table */}
        <div className="col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden">
          {/* Filter bar */}
          <div className="px-4 py-3 border-b border-zinc-100 flex gap-2">
            <form method="GET" className="flex gap-2">
              <select name="status" defaultValue={status} className="rounded-md border border-zinc-200 px-2 py-1 text-xs focus:outline-none">
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
              <select name="type" defaultValue={type} className="rounded-md border border-zinc-200 px-2 py-1 text-xs focus:outline-none">
                <option value="">All Types</option>
                {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <button type="submit" className="rounded bg-zinc-900 px-3 py-1 text-xs text-white">Filter</button>
            </form>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left">Asset</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {assets.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-400">No assets found</td></tr>
              )}
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{a.name}</p>
                    {a.brand && <p className="text-xs text-zinc-400">{a.brand}</p>}
                    {a.serialNumber && <p className="text-xs text-zinc-400 font-mono">{a.serialNumber}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-zinc-500">{a.assetCode ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600">{a.type}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600">{a.condition}</td>
                  <td className="px-4 py-3 text-xs">{a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteAsset.bind(null, a.id)}>
                      <DeleteButton className="text-xs text-red-500 hover:text-red-700" message="Delete this asset?" />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
