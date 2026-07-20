"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

const DeptSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  headId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const DesigSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().optional(),
  salaryGrade: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function createDepartment(formData: FormData) {
  await requireUser();
  const parsed = DeptSchema.parse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    headId: formData.get("headId") || undefined,
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") !== "false",
  });
  await prisma.hRMDepartment.create({
    data: {
      name: parsed.name,
      code: parsed.code || null,
      headId: parsed.headId ? Number(parsed.headId) : null,
      description: parsed.description || null,
      isActive: parsed.isActive,
    },
  });
  revalidatePath("/hrm/departments");
  redirect("/hrm/departments");
}

export async function updateDepartment(id: number, formData: FormData) {
  await requireUser();
  const parsed = DeptSchema.parse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    headId: formData.get("headId") || undefined,
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") !== "false",
  });
  await prisma.hRMDepartment.update({
    where: { id },
    data: {
      name: parsed.name,
      code: parsed.code || null,
      headId: parsed.headId ? Number(parsed.headId) : null,
      description: parsed.description || null,
      isActive: parsed.isActive,
    },
  });
  revalidatePath("/hrm/departments");
  redirect("/hrm/departments");
}

export async function deleteDepartment(id: number) {
  await requireUser();
  await prisma.hRMDepartment.delete({ where: { id } });
  revalidatePath("/hrm/departments");
}

export async function createDesignation(formData: FormData) {
  await requireUser();
  const parsed = DesigSchema.parse({
    name: formData.get("name"),
    departmentId: formData.get("departmentId") || undefined,
    salaryGrade: formData.get("salaryGrade") || undefined,
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") !== "false",
  });
  const crmRole = (formData.get("crmRole") as string) || null;
  const crmHrmRole = (formData.get("crmHrmRole") as string) || null;
  await prisma.hRMDesignation.create({
    data: {
      name: parsed.name,
      departmentId: parsed.departmentId ? Number(parsed.departmentId) : null,
      salaryGrade: parsed.salaryGrade || null,
      description: parsed.description || null,
      isActive: parsed.isActive,
      crmRole: crmRole || null,
      crmHrmRole: crmHrmRole || null,
    },
  });
  revalidatePath("/hrm/designations");
  redirect("/hrm/designations");
}

export async function updateDesignation(id: number, formData: FormData) {
  await requireUser();
  const parsed = DesigSchema.parse({
    name: formData.get("name"),
    departmentId: formData.get("departmentId") || undefined,
    salaryGrade: formData.get("salaryGrade") || undefined,
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") !== "false",
  });
  await prisma.hRMDesignation.update({
    where: { id },
    data: {
      name: parsed.name,
      departmentId: parsed.departmentId ? Number(parsed.departmentId) : null,
      salaryGrade: parsed.salaryGrade || null,
      description: parsed.description || null,
      isActive: parsed.isActive,
    },
  });
  revalidatePath("/hrm/designations");
  redirect("/hrm/designations");
}

export async function updateDesignationRoles(id: number, formData: FormData) {
  await requireUser();
  const crmRole = (formData.get("crmRole") as string) || null;
  const crmHrmRole = (formData.get("crmHrmRole") as string) || null;
  await prisma.hRMDesignation.update({
    where: { id },
    data: { crmRole: crmRole || null, crmHrmRole: crmHrmRole || null },
  });
  revalidatePath("/hrm/designations");
}

export async function deleteDesignation(id: number) {
  await requireUser();
  await prisma.hRMDesignation.delete({ where: { id } });
  revalidatePath("/hrm/designations");
}
