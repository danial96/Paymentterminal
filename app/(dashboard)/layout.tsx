import { requireUser, userHasPermission } from "@/lib/scope";
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

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/clients", label: "Clients" },
    ...(userHasPermission(user, "sellers")       ? [{ href: "/sellers",       label: "Sellers" }]       : []),
    ...(userHasPermission(user, "monthly_sales") ? [{ href: "/monthly-sales", label: "Monthly Sales" }] : []),
    ...(userHasPermission(user, "renewals")      ? [{ href: "/renewals",      label: "Renewals" }]      : []),
    ...(userHasPermission(user, "invoices")      ? [{ href: "/invoices",      label: "Invoices" }]      : []),
  ];

  const adminLinks = [
    { href: "/admin/users", label: "Users" },
    { href: "/admin/brands", label: "Brands" },
    { href: "/admin/service-types", label: "Service Types" },
    { href: "/admin/sync", label: "Sync" },
    { href: "/admin/trash", label: "Trash" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <NavSidebar
        user={{ name: user.name ?? sessionUser.name ?? "", role: (user.role ?? sessionUser.role) as string }}
        navLinks={navLinks}
        adminLinks={adminLinks}
        isAdmin={isAdmin}
      />
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header bar */}
        <header className="flex h-12 items-center justify-between border-b px-6 shrink-0" style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Softcube CRM</span>
          </div>
          <TopbarUserMenu user={{ name: user.name ?? sessionUser.name ?? "", role: (user.role ?? sessionUser.role) as string }} isAdmin={isAdmin} />
        </header>
        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto" style={{ backgroundColor: "var(--main-bg)" }}>{children}</main>
      </div>
    </div>
  );
}
