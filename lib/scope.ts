import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "super-admin") redirect("/dashboard");
  return user;
}

export type AppPermission = "invoices" | "sellers" | "monthly_sales" | "renewals" | "hrm";

export function userHasPermission(user: { role: string; permissions?: unknown }, perm: AppPermission): boolean {
  if (user.role === "admin" || user.role === "super-admin") return true;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes(perm);
}

/** Returns true if user is HRM-only — has hrmRole but no CRM role/permissions */
export function isHrmOnly(user: { role: string; hrmRole?: string | null; permissions?: unknown }): boolean {
  if (user.role === "admin" || user.role === "super-admin") return false;
  if (!user.hrmRole) return false;
  const perms = Array.isArray(user.permissions) ? (user.permissions as string[]) : [];
  const crmPerms: AppPermission[] = ["invoices", "sellers", "monthly_sales", "renewals"];
  const hasCrmPerm = crmPerms.some((p) => perms.includes(p));
  const isCrmRole = ["project_manager", "upseller", "production_department"].includes(user.role);
  return !hasCrmPerm && !isCrmRole;
}

export async function requirePermission(perm: AppPermission) {
  const sessionUser = await requireUser();
  if (sessionUser.role === "admin" || sessionUser.role === "super-admin") return sessionUser;
  const { prisma } = await import("@/lib/prisma");
  const dbUser = await prisma.user.findUnique({
    where: { id: Number(sessionUser.id) },
    select: { permissions: true, role: true },
  });
  if (!userHasPermission(dbUser ?? sessionUser, perm)) redirect("/dashboard");
  return sessionUser;
}

/** Blocks HRM-only users from accessing CRM pages */
export async function requireCrmAccess() {
  const sessionUser = await requireUser();
  if (sessionUser.role === "admin" || sessionUser.role === "super-admin") return sessionUser;
  const { prisma } = await import("@/lib/prisma");
  const dbUser = await prisma.user.findUnique({
    where: { id: Number(sessionUser.id) },
    select: { permissions: true, role: true, hrmRole: true },
  });
  if (dbUser && isHrmOnly(dbUser)) redirect("/hrm");
  return sessionUser;
}

/** Prisma `where` clause fragment scoping clients to what the current role is allowed to see. */
export function clientScopeWhere(user: { id: string; role: string }) {
  if (user.role === "admin" || user.role === "super-admin") return {};
  if (user.role === "project_manager") {
    return { projectManagerId: Number(user.id) };
  }
  return { frontSellerId: Number(user.id) };
}
