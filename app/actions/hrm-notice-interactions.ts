"use server";
// exports: toggleReaction, addComment, deleteComment, toggleCommentReaction
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function requireEmployee() {
  const session = await auth();
  if (!session?.user || session.user.role !== "employee") redirect("/portal/login");
  return Number((session.user as any).employeeId);
}

export async function toggleReaction(noticeId: number, emoji: string) {
  const employeeId = await requireEmployee();

  const existing = await prisma.hRMNoticeReaction.findUnique({
    where: { noticeId_employeeId_emoji: { noticeId, employeeId, emoji } },
  });

  if (existing) {
    await prisma.hRMNoticeReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.hRMNoticeReaction.create({ data: { noticeId, employeeId, emoji } });
  }

  revalidatePath("/portal/notices");
  revalidatePath("/portal/dashboard");
}

export async function addComment(noticeId: number, content: string, parentId?: number) {
  const employeeId = await requireEmployee();
  if (!content.trim()) return { error: "Comment cannot be empty" };

  await prisma.hRMNoticeComment.create({
    data: {
      notice: { connect: { id: noticeId } },
      employee: { connect: { id: employeeId } },
      content: content.trim(),
      ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
    },
  });

  revalidatePath("/portal/notices");
}

export async function deleteComment(commentId: number) {
  const employeeId = await requireEmployee();
  const comment = await prisma.hRMNoticeComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.employeeId !== employeeId) return { error: "Not allowed" };

  await prisma.hRMNoticeComment.delete({ where: { id: commentId } });
  revalidatePath("/portal/notices");
}

export async function toggleCommentReaction(commentId: number, emoji: string) {
  const employeeId = await requireEmployee();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const existing = await db.hRMCommentReaction.findFirst({
    where: { commentId, employeeId, emoji },
  });

  if (existing) {
    await db.hRMCommentReaction.delete({ where: { id: existing.id } });
  } else {
    await db.hRMCommentReaction.create({ data: { commentId, employeeId, emoji } });
  }

  revalidatePath("/portal/notices");
}
