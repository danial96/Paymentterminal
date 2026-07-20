"use server";

import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const sessionUser = await requireUser();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!name || !email) return { error: "Name and email are required" };

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: Number(sessionUser.id) } },
  });
  if (existing) return { error: "Email already in use" };

  await prisma.user.update({
    where: { id: Number(sessionUser.id) },
    data: { name, email },
  });

  revalidatePath("/account");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const sessionUser = await requireUser();
  const current = formData.get("currentPassword") as string;
  const next = formData.get("newPassword") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!current || !next || !confirm) return { error: "All fields are required" };
  if (next.length < 8) return { error: "New password must be at least 8 characters" };
  if (next !== confirm) return { error: "Passwords do not match" };

  const user = await prisma.user.findUnique({ where: { id: Number(sessionUser.id) } });
  if (!user) return { error: "User not found" };

  const valid = await bcrypt.compare(current, user.password);
  if (!valid) return { error: "Current password is incorrect" };

  const hashed = await bcrypt.hash(next, 10);
  await prisma.user.update({ where: { id: Number(sessionUser.id) }, data: { password: hashed } });

  return { success: true };
}
