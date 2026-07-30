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

function Badge({ count }: { count: number }) {
  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function NavSidebar({
  user,
  navLinks,
  adminLinks,
  isAdmin,
  hasInvoicesPermission,
  badges = {},
}: {
  user: { name: string; role: string };
  navLinks: NavLink[];
  adminLinks: NavLink[];
  isAdmin: boolean;
  hasInvoicesPermission?: boolean;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [crmOpen, setCrmOpen] = useState(pathname.startsWith("/dashboard") || pathname.startsWith("/clients") || pathname.startsWith("/sellers") || pathname.startsWith("/monthly-sales") || pathname.startsWith("/renewals") || pathname.startsWith("/invoices") || pathname.startsWith("/admin/stripe-accounts") || pathname.startsWith("/admin/bank-accounts") || pathname === "/dashboard");
  const [paymentOpen, setPaymentOpen] = useState(pathname.startsWith("/admin/stripe-accounts") || pathname.startsWith("/invoices") || pathname.startsWith("/admin/bank-accounts"));
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <aside className="flex w-56 flex-col h-full" style={{ background: "#141516", color: "#ffffff" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="IKIA TECH" style={{ height: "48px", objectFit: "contain" }} />
        {/* Close button on mobile */}
        <button
          className="lg:hidden text-white/40 hover:text-white p-1"
          onClick={() => setMobileOpen(false)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-scroll flex flex-1 flex-col gap-0.5 px-2 py-3 text-sm overflow-y-auto min-h-0">
        {/* CRM Section */}
        {(
          <div className="mt-0">
            <button
              onClick={() => setCrmOpen((o) => !o)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                crmOpen ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-white/50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </span>
              <span className="flex-1 text-left text-sm">CRM</span>
              <svg
                className={`h-3.5 w-3.5 text-white/30 transition-transform ${crmOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {crmOpen && (
              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                      isActive(link.href)
                        ? "text-white font-medium brand-active"
                        : "text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={`shrink-0 ${isActive(link.href) ? "text-white" : "text-white/50"}`}>
                      {NAV_ICONS[link.href]}
                    </span>
                    {link.label}
                  </Link>
                ))}

                {/* Payment Terminal inside CRM */}
                {(isAdmin || hasInvoicesPermission) && (
                  <div className="mt-1">
                    <button
                      onClick={() => setPaymentOpen((o) => !o)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                        paymentOpen ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="flex-1 text-left">Payment Terminal</span>
                      <svg
                        className={`h-3 w-3 text-white/30 transition-transform ${paymentOpen ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {paymentOpen && (
                      <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                        <Link
                          href="/invoices"
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                            isActive("/invoices") ? "brand-active text-white font-medium" : "text-white/50 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Invoices
                        </Link>
                        {isAdmin && (
                          <>
                            <Link
                              href="/admin/stripe-accounts"
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                                isActive("/admin/stripe-accounts") ? "brand-active text-white font-medium" : "text-white/50 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Stripe Accounts
                            </Link>
                            <Link
                              href="/admin/bank-accounts"
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
                                isActive("/admin/bank-accounts") ? "brand-active text-white font-medium" : "text-white/50 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <>
            <div className="mt-4 mb-1 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Admin</p>
            </div>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive(link.href)
                    ? "brand-active text-white font-medium shadow-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={isActive(link.href) ? "text-white" : "text-white/50"}>
                  {NAV_ICONS[link.href]}
                </span>
                {link.label}
                {badges[link.href] ? <Badge count={badges[link.href]} /> : null}
              </Link>
            ))}
            <div className="mt-3 px-1">
              <SyncButton />
            </div>
          </>
        )}


      </nav>

      {/* User + Sign out */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-2 flex items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white uppercase" style={{ background: "linear-gradient(135deg, #29c0d5, #503d98)" }}>
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

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-56 lg:flex-col lg:min-h-screen shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-56 z-50">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile hamburger button — rendered inside layout header via context trick */}
      {/* We expose a toggle fn via a global button rendered in children slot */}
      <button
        id="sidebar-toggle"
        className="lg:hidden fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg text-white"
        style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
