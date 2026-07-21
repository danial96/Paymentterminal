import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createNotice, deleteNotice, publishNotice } from "@/app/actions/hrm-notices";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";

const PRIORITY_STYLES: Record<string, string> = {
  LOW:    "bg-zinc-100 text-zinc-500",
  NORMAL: "bg-blue-50 text-blue-600",
  HIGH:   "bg-orange-50 text-orange-600",
  URGENT: "bg-red-50 text-red-600",
};

const TYPE_STYLES: Record<string, string> = {
  GENERAL: "bg-zinc-100 text-zinc-600",
  URGENT:  "bg-red-100 text-red-700",
  POLICY:  "bg-blue-100 text-blue-700",
  EVENT:   "bg-purple-100 text-purple-700",
  HR:      "bg-yellow-100 text-yellow-700",
};

const TYPE_ICONS: Record<string, string> = {
  GENERAL: "📢",
  URGENT:  "🚨",
  POLICY:  "📋",
  EVENT:   "🎉",
  HR:      "👥",
};

export default async function NoticesPage() {
  await requireUser();
  const [notices, departments] = await Promise.all([
    prisma.hRMNotice.findMany({ orderBy: { createdAt: "desc" }, include: { department: true } }),
    prisma.hRMDepartment.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const published = notices.filter((n) => n.isPublished);
  const drafts = notices.filter((n) => !n.isPublished);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Company Notices</h1>
          <p className="text-sm text-zinc-500">{published.length} published · {drafts.length} draft{drafts.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Post Notice Form */}
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4 sticky top-4">
            <h2 className="text-sm font-semibold text-zinc-900">Post a Notice</h2>
            <form action={createNotice} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Title *</label>
                <input name="title" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="Notice title..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Content *</label>
                <textarea name="content" required rows={5} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none" placeholder="Write your notice here..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Type</label>
                  <select name="type" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                    <option value="GENERAL">📢 General</option>
                    <option value="URGENT">🚨 Urgent</option>
                    <option value="POLICY">📋 Policy</option>
                    <option value="EVENT">🎉 Event</option>
                    <option value="HR">👥 HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Priority</label>
                  <select name="priority" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Department (optional)</label>
                <select name="departmentId" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                  <option value="">All Employees</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Expiry Date (optional)</label>
                <input name="expiresAt" type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input name="isPublished" type="checkbox" value="true" id="publish" className="rounded border-zinc-300" />
                <span className="text-sm text-zinc-700">Publish immediately</span>
              </label>
              <button type="submit" className="btn-brand w-full rounded-lg py-2.5 text-sm font-semibold text-white">
                Post Notice
              </button>
            </form>
          </div>
        </div>

        {/* Notice List */}
        <div className="xl:col-span-3 space-y-4">
          {notices.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-16 text-center text-zinc-400 text-sm">No notices yet</div>
          )}

          {drafts.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Drafts</p>
              {drafts.map((n) => (
                <NoticeRow key={n.id} n={n} isDraft />
              ))}
            </div>
          )}

          {published.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Published</p>
              {published.map((n) => (
                <NoticeRow key={n.id} n={n} isDraft={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoticeRow({ n, isDraft }: { n: any; isDraft: boolean }) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${isDraft ? "border-dashed border-zinc-300" : "border-zinc-200"}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-0.5 shrink-0">{TYPE_ICONS[n.type] ?? "📢"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_STYLES[n.type] ?? "bg-zinc-100 text-zinc-600"}`}>{n.type}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[n.priority] ?? "bg-zinc-100"}`}>{n.priority}</span>
            {isDraft && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-600">DRAFT</span>}
            {n.department && <span className="rounded-full px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-500">{n.department.name}</span>}
          </div>
          <p className="text-sm font-semibold text-zinc-900 leading-snug">{n.title}</p>
          {n.content && <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{n.content}</p>}
          <p className="text-[10px] text-zinc-400 mt-1.5">
            {isDraft ? "Draft" : `Published ${new Date(n.publishedAt ?? n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isDraft && (
            <form action={publishNotice.bind(null, n.id)}>
              <button type="submit" className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                Publish
              </button>
            </form>
          )}
          <form action={deleteNotice.bind(null, n.id)}>
            <DeleteButton className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors" message="Delete this notice?">
              Delete
            </DeleteButton>
          </form>
        </div>
      </div>
    </div>
  );
}
