import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export type AppPermission = "invoices" | "sellers" | "monthly_sales" | "renewals" | "hrm";

export function userHasPermission(user: { role: string; permissions?: unknown }, perm: AppPermission): boolean {
  if (user.role === "admin") return true;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes(perm);
}

export async function requirePermission(perm: AppPermission) {
  const sessionUser = await requireUser();
  if (sessionUser.role === "admin") return sessionUser;
  const { prisma } = await import("@/lib/prisma");
  const dbUser = await prisma.user.findUnique({
    where: { id: Number(sessionUser.id) },
    select: { permissions: true, role: true },
  });
  if (!userHasPermission(dbUser ?? sessionUser, perm)) redirect("/dashboard");
  return sessionUser;
}

/** Prisma `where` clause fragment scoping clients to what the current role is allowed to see. */
export function clientScopeWhere(user: { id: string; role: string }) {
  if (user.role === "admin") return {};
  if (user.role === "project_manager") {
    return { projectManagerId: Number(user.id) };
  }
  return { frontSellerId: Number(user.id) };
}
