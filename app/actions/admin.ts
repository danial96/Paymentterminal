"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scope";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { classifyServiceCategory } from "@/lib/serviceCategory";

// --- Brands ---
export async function createBrand(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.brand.create({ data: { name } });
  revalidatePath("/admin/brands");
}

export async function deleteBrand(id: number) {
  await requireAdmin();
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/brands");
}

// --- Service Types ---
export async function createServiceType(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const isRecurring = formData.get("isRecurring") === "on";
  if (!name) return;
  await prisma.serviceType.create({
    data: { name, isRecurring, category: classifyServiceCategory(name) },
  });
  revalidatePath("/admin/service-types");
}

export async function deleteServiceType(id: number) {
  await requireAdmin();
  await prisma.serviceType.delete({ where: { id } });
  revalidatePath("/admin/service-types");
}

export async function updateServiceType(id: number, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const isRecurring = formData.get("isRecurring") === "on";
  if (!name) return;
  await prisma.serviceType.update({
    where: { id },
    data: { name, isRecurring, category: classifyServiceCategory(name) },
  });
  revalidatePath("/admin/service-types");
}

// --- Users ---
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "project_manager", "front_seller"]),
});

export async function createUser(formData: FormData) {
  await requireAdmin();
  const parsed = userSchema.parse(Object.fromEntries(formData));
  const isUpseller = formData.get("isUpseller") === "on";

  await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      password: await bcrypt.hash(parsed.password, 10),
      role: parsed.role,
      isUpseller,
    },
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(id: number) {
  await requireAdmin();
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function toggleUpseller(id: number, isUpseller: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { isUpseller } });
  revalidatePath("/admin/users");
}

export async function updateUser(id: number, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as "admin" | "project_manager" | "front_seller";
  if (!name) return;
  await prisma.user.update({ where: { id }, data: { name, role } });
  revalidatePath("/admin/users");
}

export async function resetUserPassword(id: number, formData: FormData) {
  await requireAdmin();
  const password = String(formData.get("password") ?? "").trim();
  if (password.length < 6) return;
  await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(password, 10) } });
  revalidatePath("/admin/users");
}

export async function toggleUserPermission(userId: number, permission: string, grant: boolean) {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { permissions: true } });
  const current = Array.isArray(user?.permissions) ? (user.permissions as string[]) : [];
  const updated = grant
    ? Array.from(new Set([...current, permission]))
    : current.filter((p) => p !== permission);
  await prisma.user.update({ where: { id: userId }, data: { permissions: updated } });
  revalidatePath("/admin/users");
}
