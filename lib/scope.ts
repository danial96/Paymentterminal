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

export type AppPermission = "invoices" | "sellers" | "monthly_sales" | "renewals" | "brands";

export function userHasPermission(user: { role: string; permissions?: unknown }, perm: AppPermission): boolean {
  if (user.role === "admin" || user.role === "super-admin") return true;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes(perm);
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

/** Non-throwing check for API routes / server actions: admin or user granted the permission in the DB. */
export async function currentUserHasPermission(perm: AppPermission): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  if (session.user.role === "admin" || session.user.role === "super-admin") return true;
  const { prisma } = await import("@/lib/prisma");
  const dbUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { permissions: true, role: true },
  });
  return !!dbUser && userHasPermission(dbUser, perm);
}

/** Admins see every invoice; everyone else only the ones they created. */
export function invoiceScopeWhere(user: { id: string; role: string }) {
  if (user.role === "admin" || user.role === "super-admin") return {};
  return { createdById: Number(user.id) };
}

export async function requireCrmAccess() {
  return requireUser();
}

/** Prisma `where` clause fragment scoping clients to what the current role is allowed to see. */
export function clientScopeWhere(user: { id: string; role: string }) {
  if (user.role === "admin" || user.role === "super-admin") return {};
  if (user.role === "project_manager") {
    return { projectManagerId: Number(user.id) };
  }
  if (user.role === "upseller") {
    // Upsellers' clients are linked via services, not directly on the client row
    return { services: { some: { upsellerId: Number(user.id), deletedAt: null } } };
  }
  // front_seller and any other seller roles
  return { frontSellerId: Number(user.id) };
}

/** Returns true if the user is a seller (front or upsell) */
export function isSeller(user: { role: string }) {
  return user.role === "front_seller" || user.role === "upseller";
}
