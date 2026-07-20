import { prisma } from "@/lib/prisma";
import { NoticeCard } from "./NoticeCard";

export default async function PortalNoticesPage() {
  const notices = await prisma.hRMNotice.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Notices</h1>
        <span className="text-xs text-zinc-400">{notices.length} notice{notices.length !== 1 ? "s" : ""}</span>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">No notices published yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <NoticeCard
              key={n.id}
              title={n.title}
              content={n.content}
              publishedAt={n.publishedAt}
              isNew={n.publishedAt != null && n.publishedAt > sevenDaysAgo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
