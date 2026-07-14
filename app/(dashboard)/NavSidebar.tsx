"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SignOutButton from "./SignOutButton";
import SyncButton from "./SyncButton";

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/dashboard": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  "/clients": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  "/sellers": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  "/monthly-sales": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  "/renewals": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  "/admin/users": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  "/admin/brands": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  "/admin/service-types": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  "/admin/sync": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  "/invoices": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "/admin/stripe-accounts": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  "/admin/trash": (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

type NavLink = { href: string; label: string };

export default function NavSidebar({
  user,
  navLinks,
  adminLinks,
  isAdmin,
  hasInvoicesPermission,
  hasHrmPermission,
}: {
  user: { name: string; role: string };
  navLinks: NavLink[];
  adminLinks: NavLink[];
  isAdmin: boolean;
  hasInvoicesPermission?: boolean;
  hasHrmPermission?: boolean;
}) {
  const pathname = usePathname();
  const [paymentOpen, setPaymentOpen] = useState(pathname.startsWith("/admin/stripe-accounts") || pathname.startsWith("/invoices") || pathname.startsWith("/admin/bank-accounts"));
  const [hrmOpen, setHrmOpen] = useState(pathname.startsWith("/hrm"));

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex w-56 flex-col bg-gray-900 text-white min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-sm shadow">
          SC
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Softcube CRM</p>
          <p className="text-xs text-white/40 leading-tight">v2.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3 text-sm overflow-y-auto min-h-0">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive(link.href)
                ? "bg-indigo-600 text-white font-medium shadow-sm"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className={isActive(link.href) ? "text-white" : "text-white/50"}>
              {NAV_ICONS[link.href]}
            </span>
            {link.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="mt-4 mb-1 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Admin
              </p>
            </div>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive(link.href)
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={isActive(link.href) ? "text-white" : "text-white/50"}>
                  {NAV_ICONS[link.href]}
                </span>
                {link.label}
              </Link>
            ))}
            <div className="mt-3 px-1">
              <SyncButton />
            </div>
          </>
        )}

        {/* HRM Module */}
        {hasHrmPermission && (
          <div className="mt-2">
            <button
              onClick={() => setHrmOpen((o) => !o)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                hrmOpen ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-white/50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              <span className="flex-1 text-left text-sm">HRM</span>
              <svg
                className={`h-3.5 w-3.5 text-white/30 transition-transform ${hrmOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {hrmOpen && (
              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                {[
                  { href: "/hrm", label: "Dashboard", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
                  { href: "/hrm/employees", label: "Employees", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
                  { href: "/hrm/attendance", label: "Attendance", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
                  { href: "/hrm/leaves", label: "Leaves", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
                  { href: "/hrm/payroll", label: "Payroll", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                  { href: "/hrm/departments", label: "Departments", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
                  { href: "/hrm/designations", label: "Designations", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
                  { href: "/hrm/shifts", label: "Shifts", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                  { href: "/hrm/holidays", label: "Holidays", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
                  { href: "/hrm/notices", label: "Notices", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
                  { href: "/hrm/assets", label: "Assets", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /> },
                  { href: "/hrm/performance", label: "Performance", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
                  { href: "/hrm/reports", label: "Reports", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                  { href: "/hrm/self-service", label: "Self Service", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
                ].map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                      (href === "/hrm" ? pathname === "/hrm" : pathname.startsWith(href))
                        ? "bg-indigo-600 text-white font-medium"
                        : "text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Terminal — visible to admins + invoice-permission users */}
        {(isAdmin || hasInvoicesPermission) && (
          <div className="mt-2">
            <button
              onClick={() => setPaymentOpen((o) => !o)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                paymentOpen ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-white/50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </span>
              <span className="flex-1 text-left text-sm">Payment Terminal</span>
              <svg
                className={`h-3.5 w-3.5 text-white/30 transition-transform ${paymentOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {paymentOpen && (
              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                <Link
                  href="/invoices"
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                    isActive("/invoices")
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Invoices
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/stripe-accounts"
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                        isActive("/admin/stripe-accounts")
                          ? "bg-indigo-600 text-white font-medium"
                          : "text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Stripe Accounts
                    </Link>
                    <Link
                      href="/admin/bank-accounts"
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                        isActive("/admin/bank-accounts")
                          ? "bg-indigo-600 text-white font-medium"
                          : "text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      Bank Accounts
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-2 flex items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{user.name}</p>
            <p className="text-[10px] capitalize text-white/40">{user.role.replace("_", " ")}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
