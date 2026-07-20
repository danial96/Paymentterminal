import { createUser } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";
import { UserRow } from "./UserRow";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Team Members</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{users.length} users · {roleCounts["admin"] ?? 0} admin · {roleCounts["project_manager"] ?? 0} PM · {roleCounts["front_seller"] ?? 0} seller</p>
        </div>
      </div>

      {/* Add User Form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-800 mb-5">Add New User</h2>
        <form action={createUser} autoComplete="off" className="max-w-2xl space-y-4">
          {/* hidden field to trick browser autofill */}
          <input type="text" name="_dummy_name" style={{ display: "none" }} autoComplete="username" />
          <input type="password" name="_dummy_pw" style={{ display: "none" }} autoComplete="current-password" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-700">Full Name <span className="text-red-500">*</span></label>
              <input name="name" required autoComplete="off" placeholder="Ali Khan" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-700">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" required autoComplete="off" placeholder="ali@company.com" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-700">Password <span className="text-red-500">*</span></label>
              <input type="password" name="password" required minLength={6} autoComplete="new-password" placeholder="Min 6 characters" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-700">System Role <span className="text-red-500">*</span></label>
              <select name="role" required className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-white">
                <option value="">— Select Role —</option>
                <option value="front_seller">Front Sales</option>
                <option value="upseller">Upseller</option>
                <option value="project_manager">Project Manager</option>
                <option value="production_department">Production Department</option>
                <option value="hr_manager">HR Manager</option>
                <option value="hr_staff">HR Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-700">HRM Access <span className="text-zinc-400 font-normal">(optional)</span></label>
              <select name="hrmRole" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-white">
                <option value="">No HRM Access</option>
                <option value="hr_manager">HR Manager</option>
                <option value="hr_staff">HR Staff</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isUpseller" id="isUpseller" className="h-4 w-4 rounded border-zinc-300" />
                <label htmlFor="isUpseller" className="text-sm text-zinc-600">Also mark as Upseller</label>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button className="btn-brand rounded-lg px-6 py-2.5 text-sm font-medium text-white">
              Add User
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">All Users</p>
          <p className="text-xs text-zinc-400">Click a row to expand</p>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-center">Upseller</th>
              <th className="px-4 py-3 font-medium">HRM Role</th>
              <th className="px-4 py-3 font-medium">Permissions</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
