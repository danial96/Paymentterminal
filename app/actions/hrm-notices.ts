"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export async function createNotice(formData: FormData) {
  const user = await requireUser();
  await prisma.hRMNotice.create({
    data: {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      type: (String(formData.get("type") ?? "GENERAL")) as "GENERAL" | "URGENT" | "POLICY" | "EVENT" | "HR",
      priority: (String(formData.get("priority") ?? "NORMAL")) as "LOW" | "NORMAL" | "HIGH" | "URGENT",
      targetAll: formData.get("targetAll") !== "false",
      departmentId: formData.get("departmentId") ? Number(formData.get("departmentId")) : null,
      isPublished: formData.get("isPublished") === "true",
      publishedAt: formData.get("isPublished") === "true" ? new Date() : null,
      expiresAt: formData.get("expiresAt") ? new Date(String(formData.get("expiresAt"))) : null,
      createdById: Number(user.id),
    },
  });
  revalidatePath("/hrm/notices");
}

export async function updateNotice(id: number, formData: FormData) {
  await requireUser();
  const isPublished = formData.get("isPublished") === "true";
  await prisma.hRMNotice.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      type: (String(formData.get("type") ?? "GENERAL")) as "GENERAL" | "URGENT" | "POLICY" | "EVENT" | "HR",
      priority: (String(formData.get("priority") ?? "NORMAL")) as "LOW" | "NORMAL" | "HIGH" | "URGENT",
      targetAll: formData.get("targetAll") !== "false",
      departmentId: formData.get("departmentId") ? Number(formData.get("departmentId")) : null,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      expiresAt: formData.get("expiresAt") ? new Date(String(formData.get("expiresAt"))) : null,
    },
  });
  revalidatePath("/hrm/notices");
}

export async function deleteNotice(id: number) {
  await requireUser();
  await prisma.hRMNotice.delete({ where: { id } });
  revalidatePath("/hrm/notices");
}

export async function publishNotice(id: number) {
  await requireUser();
  await prisma.hRMNotice.update({
    where: { id },
    data: { isPublished: true, publishedAt: new Date() },
  });
  revalidatePath("/hrm/notices");
}
