"use server";

import { prisma } from "@/lib/prisma";
import { requireUser, clientScopeWhere } from "@/lib/scope";
import { revalidatePath } from "next/cache";

export async function markServiceRenewed(serviceId: number) {
  const user = await requireUser();
  const scope = clientScopeWhere(user);

  const service = await prisma.clientService.findFirst({
    where: { id: serviceId, deletedAt: null, client: { ...scope, deletedAt: null } },
    select: { id: true },
  });
  if (!service) throw new Error("Service not found or access denied");

  await prisma.clientService.update({
    where: { id: serviceId },
    data: { status: "completed" },
  });

  revalidatePath("/renewals");
}
