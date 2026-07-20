"use server";
import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function enablePortalAccess(employeeId: number, email: string, password: string) {
  await requireUser();
  const hashed = await bcrypt.hash(password, 10);
  await prisma.hRMEmployee.update({
    where: { id: employeeId },
    data: { portalEmail: email, portalPassword: hashed, portalEnabled: true },
  });
  revalidatePath(`/hrm/employees/${employeeId}`);
  return { success: true };
}

export async function disablePortalAccess(employeeId: number) {
  await requireUser();
  await prisma.hRMEmployee.update({
    where: { id: employeeId },
    data: { portalEnabled: false },
  });
  revalidatePath(`/hrm/employees/${employeeId}`);
  return { success: true };
}

export async function generateRegistrationLink(label?: string) {
  await requireUser();
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.hRMRegistrationToken.create({ data: { token, label: label || null, expiresAt } });
  revalidatePath("/hrm/employees");
  return token;
}

export async function submitRegistration(token: string, data: {
  firstName: string; lastName: string; fatherName?: string;
  phone?: string; personalEmail?: string; cnic?: string;
  dateOfBirth?: string; gender?: string; currentAddress?: string;
  emergencyContactName?: string; emergencyContact?: string; emergencyContactRelation?: string;
}) {
  const reg = await prisma.hRMRegistrationToken.findUnique({ where: { token } });
  if (!reg) return { error: "Invalid link" };
  if (reg.usedAt) return { error: "This link has already been used" };
  if (reg.expiresAt < new Date()) return { error: "This link has expired" };

  // Generate employee ID
  const count = await prisma.hRMEmployee.count();
  const employeeId = `EMP-${String(count + 1001).padStart(4, "0")}`;

  const employee = await prisma.hRMEmployee.create({
    data: {
      employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      fatherName: data.fatherName || null,
      phone: data.phone || null,
      personalEmail: data.personalEmail || null,
      cnic: data.cnic || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: (data.gender as "MALE" | "FEMALE" | "OTHER") || null,
      currentAddress: data.currentAddress || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContact: data.emergencyContact || null,
      emergencyContactRelation: data.emergencyContactRelation || null,
      status: "INACTIVE", // pending HR approval
    },
  });

  await prisma.hRMRegistrationToken.update({
    where: { token },
    data: { usedAt: new Date(), employeeId: employee.id },
  });

  return { success: true, name: `${data.firstName} ${data.lastName}` };
}

export async function approveEmployee(employeeId: number) {
  await requireUser();
  await prisma.hRMEmployee.update({
    where: { id: employeeId },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/hrm/employees");
  return { success: true };
}

export async function deleteRegistrationToken(id: number) {
  await requireUser();
  await prisma.hRMRegistrationToken.delete({ where: { id } });
  revalidatePath("/hrm/employees");
}
