"use server";

import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, clientScopeWhere } from "@/lib/scope";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  medium: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  brandId: z.string().optional().or(z.literal("")),
  frontSellerId: z.string().optional().or(z.literal("")),
  projectManagerId: z.string().optional().or(z.literal("")),
});

function toIntOrNull(v: string | undefined) {
  return v ? Number(v) : null;
}

export async function createClient(formData: FormData) {
  const user = await requireUser();
  const parsed = clientSchema.parse(Object.fromEntries(formData));

  const client = await prisma.client.create({
    data: {
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      medium: parsed.medium || null,
      notes: parsed.notes || null,
      brandId: toIntOrNull(parsed.brandId),
      frontSellerId:
        toIntOrNull(parsed.frontSellerId) ?? (user.role === "front_seller" ? Number(user.id) : null),
      projectManagerId:
        toIntOrNull(parsed.projectManagerId) ?? (user.role === "project_manager" ? Number(user.id) : null),
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: number, formData: FormData) {
  await requireUser();
  const parsed = clientSchema.parse(Object.fromEntries(formData));

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      medium: parsed.medium || null,
      notes: parsed.notes || null,
      brandId: toIntOrNull(parsed.brandId),
      frontSellerId: toIntOrNull(parsed.frontSellerId),
      projectManagerId: toIntOrNull(parsed.projectManagerId),
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClient(clientId: number) {
  await requireAdmin();
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/clients");
  redirect("/clients");
}

export interface ClientFilters {
  q?: string;
  brand?: string;
  serviceType?: string;
  frontSeller?: string;
  pm?: string;
  remaining?: "has" | "paid";
  dateFrom?: string;
  dateTo?: string;
  dueStatus?: "overdue" | "soon";
  months?: string[]; // format: ["YYYY-MM", ...]
  sortBy?: "newest" | "oldest" | "name_asc" | "name_desc" | "due_asc" | "due_desc";
}

export async function searchClients(filters: ClientFilters, page = 1) {
  const user = await requireUser();
  const scope = clientScopeWhere(user);
  const { q, brand, serviceType, frontSeller, pm, remaining, dateFrom, dateTo, dueStatus, months, sortBy } = filters;

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return prisma.client.findMany({
    where: {
      deletedAt: null,
      ...scope,
      ...(q ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      } : {}),
      ...(brand ? { brand: { name: { contains: brand } } } : {}),
      ...(frontSeller ? {
        OR: [
          { frontSeller: { name: { contains: frontSeller } } },
          { frontSellerName: { contains: frontSeller } },
        ],
      } : {}),
      ...(pm ? {
        OR: [
          { projectManager: { name: { contains: pm } } },
          { pmName: { contains: pm } },
        ],
      } : {}),
      ...(serviceType ? {
        services: { some: { deletedAt: null, serviceType: { name: { contains: serviceType } } } },
      } : {}),
      ...(dateFrom || dateTo ? {
        services: {
          some: {
            deletedAt: null,
            saleDate: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
            },
          },
        },
      } : {}),
      ...(dueStatus === "overdue" ? {
        services: { some: { deletedAt: null, endDate: { lt: now }, serviceType: { isRecurring: true } } },
      } : dueStatus === "soon" ? {
        services: { some: { deletedAt: null, endDate: { gte: now, lte: soon }, serviceType: { isRecurring: true } } },
      } : {}),
      ...(months && months.length > 0 ? {
        services: {
          some: {
            deletedAt: null,
            OR: months.map((m) => {
              const [y, mo] = m.split("-").map(Number);
              return { saleDate: { gte: new Date(Date.UTC(y, mo - 1, 1)), lt: new Date(Date.UTC(y, mo, 1)) } };
            }),
          },
        },
      } : {}),
    },
    include: {
      brand: true,
      frontSeller: true,
      projectManager: true,
      services: {
        where: { deletedAt: null },
        select: {
          serviceType: { select: { name: true, isRecurring: true } },
          durationYears: true,
          soldByName: true,
          upsellerName: true,
          saleDate: true,
          totalAmount: true,
          endDate: true,
          payments: {
            where: { deletedAt: null },
            select: { amount: true },
          },
        },
        orderBy: { saleDate: "asc" },
      },
    },
    orderBy: sortBy === "oldest" ? { createdAt: "asc" as const }
      : sortBy === "name_asc" ? { name: "asc" as const }
      : sortBy === "name_desc" ? { name: "desc" as const }
      : { createdAt: "desc" as const },
    skip: (page - 1) * 50,
    take: 50,
  });
}

export async function countClients(filters: ClientFilters) {
  const user = await requireUser();
  const scope = clientScopeWhere(user);
  const { q, brand, serviceType, frontSeller, pm, dateFrom, dateTo, dueStatus, months } = filters;

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return prisma.client.count({
    where: {
      deletedAt: null,
      ...scope,
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}),
      ...(brand ? { brand: { name: { contains: brand } } } : {}),
      ...(serviceType ? { services: { some: { deletedAt: null, serviceType: { name: { contains: serviceType } } } } } : {}),
      ...(frontSeller ? { OR: [{ frontSeller: { name: { contains: frontSeller } } }, { frontSellerName: { contains: frontSeller } }] } : {}),
      ...(dateFrom || dateTo ? { services: { some: { deletedAt: null, saleDate: { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}) } } } } : {}),
      ...(dueStatus === "overdue" ? { services: { some: { deletedAt: null, endDate: { lt: now }, serviceType: { isRecurring: true } } } } : dueStatus === "soon" ? { services: { some: { deletedAt: null, endDate: { gte: now, lte: soon }, serviceType: { isRecurring: true } } } } : {}),
      ...(months && months.length > 0 ? { services: { some: { deletedAt: null, OR: months.map((m) => { const [y, mo] = m.split("-").map(Number); return { saleDate: { gte: new Date(Date.UTC(y, mo - 1, 1)), lt: new Date(Date.UTC(y, mo, 1)) } }; }) } } } : {}),
    },
  });
}

export async function loadMoreClients(filters: ClientFilters, page: number) {
  return searchClients(filters, page);
}
