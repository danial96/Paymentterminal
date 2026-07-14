"use client";

import { useState } from "react";
import { updateUser, resetUserPassword, deleteUser, toggleUpseller, toggleUserPermission } from "@/app/actions/admin";

const ALL_PERMISSIONS = [
  { key: "invoices",      label: "Invoices / Payment Terminal" },
  { key: "sellers",       label: "Sellers" },
  { key: "monthly_sales", label: "Monthly Sales" },
  { key: "renewals",      label: "Renewals" },
  { key: "hrm",           label: "HRM Module" },
];

const ROLE_LABELS: Record<string, string> = {
  admin:                "Admin",
  project_manager:      "Project Manager",
  front_seller:         "Front Sales",
  upseller:             "Upseller",
  production_department:"Production Dept",
};

const ROLE_COLORS: Record<string, string> = {
  admin:                "bg-indigo-100 text-indigo-700",
  project_manager:      "bg-blue-100 text-blue-700",
  front_seller:         "bg-zinc-100 text-zinc-600",
  upseller:             "bg-amber-100 text-amber-700",
  production_department:"bg-emerald-100 text-emerald-700",
};

const HRM_ROLE_LABELS: Record<string, string> = {
  hr_manager: "HR Manager",
  hr_staff:   "HR Staff",
};

const HRM_ROLE_COLORS: Record<string, string> = {
  hr_manager: "bg-purple-100 text-purple-700",
  hr_staff:   "bg-pink-100 text-pink-700",
};

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  hrmRole: string | null;
  isUpseller: boolean;
  permissions: unknown;
}

export function UserRow({ user }: { user: User }) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);

  const isAdmin = user.role === "admin";
  const perms: string[] = Array.isArray(user.permissions)
    ? (user.permissions as string[])
    : typeof user.permissions === "string"
    ? (() => { try { return JSON.parse(user.permissions as string); } catch { return []; } })()
    : [];

  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <tr
        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Avatar + Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ROLE_COLORS[user.role] ?? "bg-zinc-100 text-zinc-600"}`}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{user.name}</p>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>
          </div>
        </td>

        {/* Role */}
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] ?? "bg-zinc-100 text-zinc-600"}`}>
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </td>

        {/* Upseller */}
        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
          <form action={toggleUpseller.bind(null, user.id, !user.isUpseller)}>
            <button type="submit" className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.isUpseller ? "bg-indigo-600" : "bg-zinc-200"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${user.isUpseller ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </form>
        </td>

        {/* HRM Role */}
        <td className="px-4 py-3">
          {user.hrmRole ? (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${HRM_ROLE_COLORS[user.hrmRole] ?? "bg-zinc-100 text-zinc-600"}`}>
              {HRM_ROLE_LABELS[user.hrmRole] ?? user.hrmRole}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">—</span>
          )}
        </td>

        {/* Permissions summary */}
        <td className="px-4 py-3">
          {isAdmin ? (
            <span className="text-xs text-indigo-500 font-medium">All access</span>
          ) : (
            <span className="text-xs text-zinc-500">
              {perms.length === 0 ? "No permissions" : `${perms.length} permission${perms.length !== 1 ? "s" : ""}`}
            </span>
          )}
        </td>

        {/* Expand arrow */}
        <td className="px-4 py-3 text-right">
          <svg className={`h-4 w-4 text-zinc-400 inline-block transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {/* Expanded panel */}
      {expanded && (
        <tr className="bg-zinc-50 border-b border-zinc-100">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Edit Info */}
              <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">Profile</p>
                  <button onClick={() => setEditMode((p) => !p)} className="text-xs text-indigo-600 hover:underline">{editMode ? "Cancel" : "Edit"}</button>
                </div>
                {editMode ? (
                  <form action={async (fd) => { await updateUser(user.id, fd); setEditMode(false); }} className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-0.5">Name</label>
                      <input name="name" defaultValue={user.name} required className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-0.5">Role</label>
                      <select name="role" defaultValue={user.role} className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="front_seller">Front Sales</option>
                        <option value="upseller">Upseller</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="production_department">Production Department</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-0.5">HRM Role</label>
                      <select name="hrmRole" defaultValue={user.hrmRole ?? ""} className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">No HRM Access</option>
                        <option value="hr_manager">HR Manager</option>
                        <option value="hr_staff">HR Staff</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full rounded bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">Save Changes</button>
                  </form>
                ) : (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 text-xs">Name</span>
                      <span className="text-zinc-900 text-xs font-medium">{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 text-xs">Email</span>
                      <span className="text-zinc-900 text-xs">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 text-xs">Role</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 text-xs">HRM Role</span>
                      {user.hrmRole ? (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${HRM_ROLE_COLORS[user.hrmRole] ?? "bg-zinc-100 text-zinc-600"}`}>{HRM_ROLE_LABELS[user.hrmRole] ?? user.hrmRole}</span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">None</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Password Reset */}
                <div className="border-t border-zinc-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Password</p>
                    <button onClick={() => setPwMode((p) => !p)} className="text-xs text-indigo-600 hover:underline">{pwMode ? "Cancel" : "Reset"}</button>
                  </div>
                  {pwMode && (
                    <form action={async (fd) => { await resetUserPassword(user.id, fd); setPwMode(false); }} className="space-y-2">
                      <input name="password" type="password" minLength={6} required placeholder="New password (min 6)" className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button type="submit" className="w-full rounded bg-zinc-800 py-1.5 text-xs font-medium text-white hover:bg-zinc-900">Update Password</button>
                    </form>
                  )}
                </div>

                {/* Delete */}
                <div className="border-t border-zinc-100 pt-3">
                  <form action={deleteUser.bind(null, user.id)} onSubmit={(e) => { if (!confirm(`Delete ${user.name}? This cannot be undone.`)) e.preventDefault(); }}>
                    <button type="submit" className="w-full rounded border border-red-200 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete User</button>
                  </form>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-white rounded-lg border border-zinc-200 p-4 lg:col-span-2">
                <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-3">Module Permissions</p>
                {isAdmin ? (
                  <p className="text-sm text-indigo-500">Admin has access to everything — no restrictions.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ALL_PERMISSIONS.map((p) => {
                      const active = perms.includes(p.key);
                      return (
                        <form key={p.key} action={toggleUserPermission.bind(null, user.id, p.key, !active)}>
                          <button type="submit" className={`flex items-center gap-3 w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${active ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"}`}>
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-emerald-100" : "bg-zinc-200"}`}>
                              <div className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-500" : "bg-zinc-400"}`} />
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${active ? "text-emerald-800" : "text-zinc-600"}`}>{p.label}</p>
                              <p className={`text-[10px] ${active ? "text-emerald-600" : "text-zinc-400"}`}>{active ? "Enabled — click to revoke" : "Disabled — click to grant"}</p>
                            </div>
                          </button>
                        </form>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}
