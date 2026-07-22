"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const LINKS = [
  {
    href: "/portal/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/portal/attendance",
    label: "My Attendance",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/portal/leaves",
    label: "My Leaves",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/portal/payslip-request",
    label: "Payslip Request",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/portal/notices",
    label: "Notices & Announcements",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    href: "/portal/bank-letter",
    label: "Bank Letter",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: "/portal/complaints",
    label: "Complaints",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  {
    href: "/portal/profile",
    label: "My Profile",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function PortalSidebar({ user }: { user: { name: string; employeeId: string } }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <aside className="flex w-56 flex-col h-full shrink-0" style={{ background: "#141516", color: "#ffffff" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="Logo" style={{ height: "48px", objectFit: "contain" }} />
        <button className="lg:hidden text-white/40 hover:text-white p-1" onClick={() => setMobileOpen(false)}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Label */}
      <div className="px-4 py-2 border-b border-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 text-center">Employee Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3 text-sm overflow-y-auto min-h-0">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive(link.href) ? "text-white font-medium shadow-sm" : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
            style={isActive(link.href) ? { background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" } : {}}
          >
            <span className={isActive(link.href) ? "text-white" : "text-white/50"}>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-white/40 mb-2">ID: {user.employeeId}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/portal/login" })}
          className="w-full rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all text-left"
        >
          Sign Out
        </button>
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-56 z-50">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile FAB hamburger */}
      <button
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
