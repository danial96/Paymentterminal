import { prisma } from "@/lib/prisma";

export default async function PortalNoticesPage() {
  const notices = await prisma.hRMNotice.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Notices</h1>

      {notices.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          No notices published yet.
        </div>
      )}

      <div className="space-y-4">
        {notices.map((n) => (
          <div key={n.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">{n.title}</h2>
                {n.publishedAt && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {n.publishedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
            {n.content && (
              <p className="mt-3 text-sm text-zinc-600 whitespace-pre-line">{n.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
