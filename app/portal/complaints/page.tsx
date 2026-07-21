import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalSubmitComplaint } from "@/app/actions/hrm-portal";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  DISMISSED: "bg-zinc-100 text-zinc-500",
};

const CATEGORIES = ["Work Environment", "Harassment", "Salary Issue", "Management", "Policy", "Other"];

export default async function PortalComplaintsPage() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const complaints = await (prisma as any).hRMComplaint.findMany({
    where: { employeeId: empId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">My Complaints</h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">Submit a Complaint</h2>
        <form action={portalSubmitComplaint} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Category</label>
            <select name="category" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-white">
              <option value="">— Select category —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input name="title" required maxLength={191} className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="Brief title of your complaint" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea name="description" required rows={4} className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none" placeholder="Describe your complaint in detail..." />
          </div>
          <button type="submit" className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}>
            Submit Complaint
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">My Complaints</h2>
          <span className="text-xs text-zinc-400">{complaints.length} total</span>
        </div>
        {complaints.length === 0 ? (
          <div className="px-5 py-10 text-center text-zinc-400 text-sm">No complaints submitted yet.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {complaints.map((c: any) => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {c.category && <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 rounded px-1.5 py-0.5">{c.category}</span>}
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_STYLES[c.status] ?? "bg-zinc-100 text-zinc-500"}`}>{c.status.replace("_", " ")}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900">{c.title}</p>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{c.description}</p>
                    {c.hrNote && (
                      <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-blue-600 mb-0.5">HR Response</p>
                        <p className="text-xs text-blue-800">{c.hrNote}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 shrink-0">{new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
