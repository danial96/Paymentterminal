"use server";

import { requireUser, requireAdmin } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

// Fields the employee is allowed to request changes for
export const REQUESTABLE_FIELDS: { key: string; label: string }[] = [
  { key: "phone",                    label: "Phone" },
  { key: "personalEmail",            label: "Personal Email" },
  { key: "currentAddress",           label: "Current Address" },
  { key: "city",                     label: "City" },
  { key: "country",                  label: "Country" },
  { key: "linkedInUrl",              label: "LinkedIn URL" },
  { key: "cnic",                     label: "CNIC / National ID" },
  { key: "emergencyContactName",     label: "Emergency Contact Name" },
  { key: "emergencyContact",         label: "Emergency Contact Phone" },
  { key: "emergencyContactRelation", label: "Emergency Contact Relation" },
];

export async function submitProfileUpdateRequest(formData: FormData) {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);
  if (!empId) return;

  const fieldKey = String(formData.get("fieldKey") ?? "").trim();
  const requestedValue = String(formData.get("requestedValue") ?? "").trim();
  if (!fieldKey || !requestedValue) return;

  const fieldDef = REQUESTABLE_FIELDS.find(f => f.key === fieldKey);
  if (!fieldDef) return;

  // Get current value from employee
  const employee = await prisma.hRMEmployee.findUnique({ where: { id: empId } });
  if (!employee) return;
  const currentValue = (employee as any)[fieldKey] ?? null;

  // Don't create duplicate pending request for same field
  const existing = await (prisma as any).hRMProfileUpdateRequest.findFirst({
    where: { employeeId: empId, fieldKey, status: "PENDING" },
  });
  if (existing) {
    // Update the existing pending request instead
    await (prisma as any).hRMProfileUpdateRequest.update({
      where: { id: existing.id },
      data: { requestedValue, currentValue: currentValue ? String(currentValue) : null },
    });
  } else {
    await (prisma as any).hRMProfileUpdateRequest.create({
      data: {
        employeeId: empId,
        fieldKey,
        fieldLabel: fieldDef.label,
        currentValue: currentValue ? String(currentValue) : null,
        requestedValue,
      },
    });
  }

  revalidatePath("/portal/profile");
}

export async function cancelProfileUpdateRequest(id: number) {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);
  await (prisma as any).hRMProfileUpdateRequest.updateMany({
    where: { id, employeeId: empId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/portal/profile");
}

export async function approveProfileUpdateRequest(id: number, employeeId: number) {
  await requireAdmin();

  const req = await (prisma as any).hRMProfileUpdateRequest.findUnique({ where: { id } });
  if (!req || req.status !== "PENDING") return;

  // Apply the change to the employee record
  await prisma.hRMEmployee.update({
    where: { id: employeeId },
    data: { [req.fieldKey]: req.requestedValue },
  });

  await (prisma as any).hRMProfileUpdateRequest.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  revalidatePath(`/hrm/employees/${employeeId}`);
  revalidatePath("/portal/profile");
}

export async function rejectProfileUpdateRequest(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const employeeId = Number(formData.get("employeeId"));
  const hrNote = String(formData.get("hrNote") ?? "").trim() || null;

  await (prisma as any).hRMProfileUpdateRequest.update({
    where: { id },
    data: { status: "REJECTED", hrNote },
  });

  revalidatePath(`/hrm/employees/${employeeId}`);
  revalidatePath("/portal/profile");
}
