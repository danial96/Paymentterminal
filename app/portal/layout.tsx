export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import PortalSidebar from "./PortalSidebar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Login page — no auth check, no sidebar
  if (pathname === "/portal/login") {
    return <>{children}</>;
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "employee") redirect("/portal/login");

  const empDbId = Number((session.user as any).employeeId);
  const [emp, lastSync] = await Promise.all([
    prisma.hRMEmployee.findUnique({ where: { id: empDbId }, select: { employeeId: true } }),
    (prisma as any).zKSyncLog.findFirst({ orderBy: { syncedAt: "desc" }, select: { syncedAt: true } }),
  ]);

  const lastSyncStr = lastSync?.syncedAt ? (() => {
    const pkt = new Date(new Date(lastSync.syncedAt).getTime() + 5 * 3600000);
    return `${String(pkt.getUTCDate()).padStart(2,"0")}/${String(pkt.getUTCMonth()+1).padStart(2,"0")} ${String(pkt.getUTCHours()).padStart(2,"0")}:${String(pkt.getUTCMinutes()).padStart(2,"0")}`;
  })() : null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-outfit), sans-serif", color: "#000" }}>
      <PortalSidebar
        user={{
          name: session.user.name ?? "",
          employeeId: emp?.employeeId ?? String(empDbId),
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-10 items-center justify-end px-4 border-b bg-white border-zinc-100 shrink-0">
          {lastSyncStr && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-60"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25a.75.75 0 0 0-1.5 0v3.5c0 .199.079.39.22.53l2 2a.75.75 0 1 0 1.06-1.06L8.75 8.19V4.75Z" clipRule="evenodd"/></svg>
              Synced {lastSyncStr} PKT
            </span>
          )}
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
