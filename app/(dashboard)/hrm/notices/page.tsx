import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createNotice, deleteNotice, publishNotice } from "@/app/actions/hrm-notices";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-zinc-100 text-zinc-500",
  NORMAL: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

export default async function NoticesPage() {
  await requireUser();
  const [notices, departments] = await Promise.all([
    prisma.hRMNotice.findMany({ orderBy: { createdAt: "desc" }, include: { department: true } }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Company Notices</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Create Notice */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Post Notice</h2>
          <form action={createNotice} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Title *</label>
              <input name="title" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Content *</label>
              <textarea name="content" required rows={4} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Type</label>
                <select name="type" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="GENERAL">General</option>
                  <option value="URGENT">Urgent</option>
                  <option value="POLICY">Policy</option>
                  <option value="EVENT">Event</option>
                  <option value="HR">HR</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Priority</label>
                <select name="priority" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Department (optional)</label>
              <select name="departmentId" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Employees</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Expiry Date (optional)</label>
              <input name="expiresAt" type="date" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <input name="isPublished" type="checkbox" value="true" id="publish" className="rounded" />
              <label htmlFor="publish" className="text-sm text-zinc-700 cursor-pointer">Publish immediately</label>
            </div>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">Post Notice</button>
          </form>
        </div>

        {/* Notice List */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">All Notices ({notices.length})</h2>
          </div>
          <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
            {notices.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-400">No notices yet</p>}
            {notices.map((n) => (
              <div key={n.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_COLORS[n.priority]}`}>{n.priority}</span>
                      {!n.isPublished && <span className="rounded-full px-2 py-0.5 text-[10px] bg-amber-100 text-amber-600">Draft</span>}
                      {n.department && <span className="rounded-full px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-600">{n.department.name}</span>}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{n.content}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{n.createdAt.toLocaleDateString("en-GB")}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.isPublished && (
                      <form action={publishNotice.bind(null, n.id)}>
                        <button type="submit" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-1">Publish</button>
                      </form>
                    )}
                    <form action={deleteNotice.bind(null, n.id)}>
                      <DeleteButton className="text-xs text-red-500 hover:text-red-700 px-1" message="Delete this notice?">Del</DeleteButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
