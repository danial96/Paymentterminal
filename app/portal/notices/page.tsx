import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NoticeCard } from "./NoticeCard";

export default async function PortalNoticesPage() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const notices = await db.hRMNotice.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    include: {
      reactions: { include: { employee: { select: { firstName: true, lastName: true } } } },
      comments: {
        // filter parentId: null in JS to avoid cached Prisma type mismatch
        include: {
          employee: { select: { firstName: true, lastName: true, id: true } },
          reactions: { include: { employee: { select: { firstName: true, lastName: true } } } },
          replies: {
            include: {
              employee: { select: { firstName: true, lastName: true, id: true } },
              reactions: { include: { employee: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
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
        <div className="space-y-4">
          {(notices as any[]).map((n: any) => (
            <NoticeCard
              key={n.id}
              noticeId={n.id}
              title={n.title}
              content={n.content}
              publishedAt={n.publishedAt}
              type={n.type}
              priority={n.priority}
              isNew={n.publishedAt != null && n.publishedAt > sevenDaysAgo}
              reactions={n.reactions.map((r) => ({
                id: r.id,
                emoji: r.emoji,
                employeeId: r.employeeId,
                employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
              }))}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              comments={(n.comments as any[]).filter((c: any) => !c.parentId).map((c: any) => ({
                id: c.id,
                content: c.content,
                createdAt: c.createdAt,
                employeeId: c.employeeId,
                employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
                reactions: (c.reactions ?? []).map((r: any) => ({
                  id: r.id, emoji: r.emoji, employeeId: r.employeeId,
                  employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
                })),
                replies: (c.replies ?? []).map((r: any) => ({
                  id: r.id,
                  content: r.content,
                  createdAt: r.createdAt,
                  employeeId: r.employeeId,
                  employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
                  reactions: (r.reactions ?? []).map((rx: any) => ({
                    id: rx.id, emoji: rx.emoji, employeeId: rx.employeeId,
                    employeeName: `${rx.employee.firstName} ${rx.employee.lastName}`,
                  })),
                })),
              }))}
              currentEmployeeId={empId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
