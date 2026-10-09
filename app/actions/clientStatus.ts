"use server";

import { prisma } from "@/lib/prisma";
import { requireUser, clientScopeWhere } from "@/lib/scope";
import { revalidatePath } from "next/cache";

export type ClientStatusValue = "new" | "active" | "follow_up" | "completed" | "lost";

export async function updateClientStatus(clientId: number, status: ClientStatusValue) {
  const user = await requireUser();
  const scope = clientScopeWhere(user);

  // Verify the client is within the user's scope
  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null, ...scope },
    select: { id: true },
  });
  if (!client) throw new Error("Client not found or access denied");

  await prisma.client.update({
    where: { id: clientId },
    data: { status: status as never },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/renewals");
}
