export const dynamic = "force-dynamic";

import { requireUser, userHasPermission, isSeller } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import NavSidebar from "./NavSidebar";
import TopbarUserMenu from "./TopbarUserMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: Number(sessionUser.id) },
    select: { name: true, role: true, permissions: true },
  }) ?? sessionUser;
  const isAdmin = user.role === "admin";
  const isSellerUser = isSeller(user);
  // Badge counts
  const badges: Record<string, number> = {};
  if (isAdmin) {
    const trashCount = await prisma.client.count({ where: { deletedAt: { not: null } } });
    if (trashCount > 0) badges["/admin/trash"] = trashCount;
  }

  const lastSync = await (prisma as any).zKSyncLog.findFirst({ orderBy: { syncedAt: "desc" }, select: { syncedAt: true } });
  const lastSyncStr = lastSync?.syncedAt ? (() => {
    const pkt = new Date(new Date(lastSync.syncedAt).getTime() + 5 * 3600000);
    return `${String(pkt.getUTCDate()).padStart(2,"0")}/${String(pkt.getUTCMonth()+1).padStart(2,"0")} ${String(pkt.getUTCHours()).padStart(2,"0")}:${String(pkt.getUTCMinutes()).padStart(2,"0")}`;
  })() : null;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/clients", label: "Clients" },
    // Sellers always see Renewals; others need permission
    ...(isSellerUser || userHasPermission(user, "renewals") ? [{ href: "/renewals", label: "Renewals" }] : []),
    // Sellers/Monthly Sales only for admin or users with permission
    ...(userHasPermission(user, "sellers") ? [{ href: "/sellers", label: "Sellers" }] : []),
    ...(userHasPermission(user, "monthly_sales") ? [{ href: "/monthly-sales", label: "Monthly Sales" }] : []),
    // Admins already get Brands under the admin links
    ...(!isAdmin && userHasPermission(user, "brands") ? [{ href: "/brands", label: "Brands" }] : []),
  ];

  const adminLinks = [
    { href: "/admin/users", label: "Users" },
    { href: "/admin/service-types", label: "Service Types" },
    { href: "/admin/sync", label: "Sync" },
    { href: "/admin/trash", label: "Trash" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" style={{ fontFamily: "var(--font-outfit), sans-serif", color: "#000" }}>
      <NavSidebar
        user={{ name: user.name ?? sessionUser.name ?? "", role: (user.role ?? sessionUser.role) as string }}
        navLinks={navLinks}
        adminLinks={adminLinks}
        isAdmin={isAdmin}
        hasInvoicesPermission={isAdmin || userHasPermission(user, "invoices")}
        badges={badges}
      />
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header bar */}
        <header className="flex h-12 items-center justify-between border-b px-4 lg:px-6 shrink-0" style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>IKIA TECH</span>
          </div>
          <div className="flex items-center gap-3">
            {lastSyncStr && (
              <span className="hidden sm:flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-60"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25a.75.75 0 0 0-1.5 0v3.5c0 .199.079.39.22.53l2 2a.75.75 0 1 0 1.06-1.06L8.75 8.19V4.75Z" clipRule="evenodd"/></svg>
                Synced {lastSyncStr}
              </span>
            )}
<TopbarUserMenu user={{ name: user.name ?? sessionUser.name ?? "", role: (user.role ?? sessionUser.role) as string }} isAdmin={isAdmin} />
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto" style={{ backgroundColor: "var(--main-bg)" }}>{children}</main>
      </div>
    </div>
  );
}
