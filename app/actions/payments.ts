"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const paymentSchema = z.object({
  clientServiceId: z.string(),
  clientId: z.string(),
  amount: z.string(),
  paymentDate: z.string(),
  note: z.string().optional().or(z.literal("")),
});

export async function addPayment(formData: FormData) {
  await requireUser();
  const parsed = paymentSchema.parse(Object.fromEntries(formData));

  await prisma.payment.create({
    data: {
      clientServiceId: Number(parsed.clientServiceId),
      amount: parsed.amount,
      paymentDate: new Date(parsed.paymentDate),
      note: parsed.note || null,
    },
  });

  revalidatePath(`/clients/${parsed.clientId}`);
  revalidatePath("/dashboard");
}
