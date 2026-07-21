import React from "react";
import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createNotice, deleteNotice, publishNotice } from "@/app/actions/hrm-notices";
import { SubmitButton } from "@/app/components/SubmitButton";
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

const TYPE_ICONS: Record<string, React.ReactNode> = {
  GENERAL: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M16 19h6m-3-3v6"/></svg>,
  URGENT:  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  POLICY:  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  EVENT:   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
  HR:      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
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
                    <option value="GENERAL">General</option>
                    <option value="URGENT">Urgent</option>
                    <option value="POLICY">Policy</option>
                    <option value="EVENT">Event</option>
                    <option value="HR">HR</option>
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
              <SubmitButton className="btn-brand w-full rounded-lg py-2.5 text-sm font-semibold text-white" pendingText="Posting...">
                Post Notice
              </SubmitButton>
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
        <div className="text-zinc-500 mt-0.5 shrink-0">{TYPE_ICONS[n.type] ?? TYPE_ICONS.GENERAL}</div>
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
              <SubmitButton className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors" pendingText="Publishing...">
                Publish
              </SubmitButton>
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
