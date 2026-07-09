import { createUser, deleteUser, toggleUpseller, toggleUserPermission } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";

const ALL_PERMISSIONS = [
  { key: "invoices",      label: "Invoices / Payment Terminal" },
  { key: "sellers",       label: "Sellers" },
  { key: "monthly_sales", label: "Monthly Sales" },
  { key: "renewals",      label: "Renewals" },
];

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900">Team Members</h1>

      {/* Add User Form */}
      <form action={createUser} className="grid max-w-xl grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="col-span-2 text-sm font-semibold text-zinc-800 mb-1">Add New User</h2>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Name</label>
          <input name="name" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Email</label>
          <input type="email" name="email" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Password</label>
          <input type="password" name="password" required minLength={6} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Role</label>
          <select name="role" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="front_seller">Front Seller</option>
            <option value="project_manager">Project Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" name="isUpseller" id="isUpseller" className="h-4 w-4 rounded border-zinc-300" />
          <label htmlFor="isUpseller" className="text-sm text-zinc-700">Also an Upseller</label>
        </div>
        <button className="col-span-2 self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          Add User
        </button>
      </form>

      {/* Users Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <th className="border-r border-zinc-200 px-4 py-3">Name</th>
              <th className="border-r border-zinc-200 px-4 py-3">Email</th>
              <th className="border-r border-zinc-200 px-4 py-3">Role</th>
              <th className="border-r border-zinc-200 px-4 py-3 text-center">Upseller</th>
              <th className="border-r border-zinc-200 px-4 py-3">Permissions</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const rawPerms = u.permissions;
              const perms: string[] = Array.isArray(rawPerms) ? (rawPerms as string[]) :
                typeof rawPerms === "string" ? (() => { try { return JSON.parse(rawPerms); } catch { return []; } })() : [];
              const isAdmin = u.role === "admin";
              return (
                <tr key={u.id} className="border-b border-zinc-100 last:border-0 align-top">
                  <td className="border-r border-zinc-100 px-4 py-3 font-medium text-zinc-900">{u.name}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-zinc-600 text-xs">{u.email}</td>
                  <td className="border-r border-zinc-100 px-4 py-3 capitalize text-zinc-600">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-600"
                    }`}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="border-r border-zinc-100 px-4 py-3 text-center">
                    <form action={toggleUpseller.bind(null, u.id, !u.isUpseller)}>
                      <button type="submit" title={u.isUpseller ? "Remove upseller" : "Make upseller"}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${u.isUpseller ? "bg-zinc-900" : "bg-zinc-200"}`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${u.isUpseller ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </form>
                  </td>
                  <td className="border-r border-zinc-100 px-4 py-3">
                    {isAdmin ? (
                      <span className="text-xs text-indigo-500 font-medium">All access (Admin)</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {ALL_PERMISSIONS.map((p) => {
                          const active = perms.includes(p.key);
                          return (
                            <form key={p.key} action={toggleUserPermission.bind(null, u.id, p.key, !active)}>
                              <button type="submit"
                                className={`flex items-center gap-2 text-xs px-2.5 py-1 rounded-md border transition-colors w-full text-left ${
                                  active
                                    ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                    : "border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50"
                                }`}>
                                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${active ? "bg-green-500" : "bg-zinc-300"}`} />
                                {p.label}
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteUser.bind(null, u.id)}>
                      <button className="text-xs text-red-500 hover:text-red-700 hover:underline">Delete</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
