"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const serviceSchema = z.object({
  clientId: z.string(),
  serviceTypeId: z.string(),
  description: z.string().optional().or(z.literal("")),
  totalAmount: z.string(),
  saleDate: z.string(),
  durationYears: z.string().optional().or(z.literal("")),
});

function addYears(date: Date, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export async function addService(formData: FormData) {
  await requireUser();
  const parsed = serviceSchema.parse(Object.fromEntries(formData));

  const serviceType = await prisma.serviceType.findUniqueOrThrow({
    where: { id: Number(parsed.serviceTypeId) },
  });

  const saleDate = new Date(parsed.saleDate);
  const durationYears = parsed.durationYears ? Number(parsed.durationYears) : null;
  const endDate = serviceType.isRecurring && durationYears ? addYears(saleDate, durationYears) : null;

  await prisma.clientService.create({
    data: {
      clientId: Number(parsed.clientId),
      serviceTypeId: Number(parsed.serviceTypeId),
      description: parsed.description || null,
      totalAmount: parsed.totalAmount,
      saleDate,
      durationYears,
      startDate: serviceType.isRecurring ? saleDate : null,
      endDate,
    },
  });

  revalidatePath(`/clients/${parsed.clientId}`);
  revalidatePath("/dashboard");
}

export async function updateServiceStatus(serviceId: number, clientId: number, status: string) {
  await requireUser();
  await prisma.clientService.update({
    where: { id: serviceId },
    data: { status: status as "active" | "completed" | "cancelled" },
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

const renewSchema = z.object({
  clientServiceId: z.string(),
  clientId: z.string(),
  durationYears: z.string(),
  amount: z.string(),
  paymentDate: z.string(),
});

export async function renewService(formData: FormData) {
  await requireUser();
  const parsed = renewSchema.parse(Object.fromEntries(formData));

  const service = await prisma.clientService.findUniqueOrThrow({
    where: { id: Number(parsed.clientServiceId) },
  });

  const base = service.endDate && service.endDate > new Date() ? service.endDate : new Date();
  const newEndDate = addYears(base, Number(parsed.durationYears));

  await prisma.$transaction([
    prisma.clientService.update({
      where: { id: service.id },
      data: {
        endDate: newEndDate,
        durationYears: Number(parsed.durationYears),
        status: "active",
      },
    }),
    prisma.payment.create({
      data: {
        clientServiceId: service.id,
        amount: parsed.amount,
        paymentDate: new Date(parsed.paymentDate),
        note: "Renewal",
      },
    }),
  ]);

  revalidatePath(`/clients/${parsed.clientId}`);
  revalidatePath("/dashboard");
}
