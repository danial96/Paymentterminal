"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import bcrypt from "bcryptjs";
import { pushUserToZK } from "@/lib/zkteco";

const EmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  fatherName: z.string().optional(),
  cnic: z.string().optional(),
  passportNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
  bloodGroup: z.string().optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  personalEmail: z.string().optional(),
  companyEmail: z.string().optional(),
  linkedInUrl: z.string().optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  managerId: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "FREELANCE"]).default("FULL_TIME"),
  joiningDate: z.string().optional(),
  confirmationDate: z.string().optional(),
  probationStatus: z.enum(["ON_PROBATION", "CONFIRMED", "EXTENDED"]).default("ON_PROBATION"),
  workLocation: z.string().optional(),
  branch: z.string().optional(),
  officeFloor: z.string().optional(),
  deskNumber: z.string().optional(),
  shiftId: z.string().optional(),
  basicSalary: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  taxNumber: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED"]).default("ACTIVE"),
  notes: z.string().optional(),
});

async function generateEmployeeId(): Promise<string> {
  const last = await prisma.hRMEmployee.findFirst({ orderBy: { id: "desc" } });
  const num = last ? 1010 + last.id + 1 : 1011;
  return `IKIA${num}`;
}

function fd(formData: FormData, key: string) {
  const v = formData.get(key);
  return v ? String(v) : undefined;
}

export async function createEmployee(formData: FormData) {
  await requireUser();
  const raw = {
    firstName: fd(formData, "firstName") ?? "",
    lastName: fd(formData, "lastName") ?? "",
    fatherName: fd(formData, "fatherName"),
    cnic: fd(formData, "cnic"),
    passportNumber: fd(formData, "passportNumber"),
    dateOfBirth: fd(formData, "dateOfBirth"),
    gender: fd(formData, "gender") as "MALE" | "FEMALE" | "OTHER" | undefined,
    maritalStatus: fd(formData, "maritalStatus") as "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | undefined,
    bloodGroup: fd(formData, "bloodGroup"),
    nationality: fd(formData, "nationality"),
    religion: fd(formData, "religion"),
    phone: fd(formData, "phone"),
    emergencyContact: fd(formData, "emergencyContact"),
    emergencyContactName: fd(formData, "emergencyContactName"),
    emergencyContactRelation: fd(formData, "emergencyContactRelation"),
    personalEmail: fd(formData, "personalEmail"),
    companyEmail: fd(formData, "companyEmail"),
    linkedInUrl: fd(formData, "linkedInUrl"),
    currentAddress: fd(formData, "currentAddress"),
    permanentAddress: fd(formData, "permanentAddress"),
    city: fd(formData, "city"),
    country: fd(formData, "country"),
    postalCode: fd(formData, "postalCode"),
    departmentId: fd(formData, "departmentId"),
    designationId: fd(formData, "designationId"),
    managerId: fd(formData, "managerId"),
    employmentType: (fd(formData, "employmentType") ?? "FULL_TIME") as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "FREELANCE",
    joiningDate: fd(formData, "joiningDate"),
    confirmationDate: fd(formData, "confirmationDate"),
    probationStatus: (fd(formData, "probationStatus") ?? "ON_PROBATION") as "ON_PROBATION" | "CONFIRMED" | "EXTENDED",
    workLocation: fd(formData, "workLocation"),
    branch: fd(formData, "branch"),
    officeFloor: fd(formData, "officeFloor"),
    deskNumber: fd(formData, "deskNumber"),
    shiftId: fd(formData, "shiftId"),
    basicSalary: fd(formData, "basicSalary"),
    bankName: fd(formData, "bankName"),
    accountNumber: fd(formData, "accountNumber"),
    iban: fd(formData, "iban"),
    taxNumber: fd(formData, "taxNumber"),
    status: (fd(formData, "status") ?? "ACTIVE") as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED" | "RESIGNED",
    notes: fd(formData, "notes"),
  };
  const parsed = EmployeeSchema.parse(raw);
  const empId = await generateEmployeeId();

  // Derive role from department name
  let userRole: "front_seller" | "upseller" | "project_manager" | "production_department" | "admin" = "front_seller";
  if (parsed.departmentId) {
    const dept = await prisma.hRMDepartment.findUnique({ where: { id: Number(parsed.departmentId) } });
    if (dept) {
      const n = dept.name.toLowerCase();
      if (n.includes("production")) userRole = "production_department";
      else if (n.includes("sales") || n.includes("front")) userRole = "front_seller";
      else if (n.includes("upsell")) userRole = "upseller";
      else if (n.includes("project") || n.includes("manager")) userRole = "project_manager";
    }
  }

  // Auto-create a user account for this employee
  const email = parsed.companyEmail || parsed.personalEmail || `${empId.toLowerCase()}@company.local`;
  const defaultPassword = empId; // employee can reset later
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Use upsert to avoid duplicate if email already exists
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: `${parsed.firstName} ${parsed.lastName}`,
      email,
      password: hashedPassword,
      role: userRole,
    },
  });

  await prisma.hRMEmployee.create({
    data: {
      employeeId: empId,
      userId: user.id,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      fatherName: parsed.fatherName || null,
      cnic: parsed.cnic || null,
      passportNumber: parsed.passportNumber || null,
      dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
      gender: parsed.gender ?? null,
      maritalStatus: parsed.maritalStatus ?? null,
      bloodGroup: parsed.bloodGroup || null,
      nationality: parsed.nationality || null,
      religion: parsed.religion || null,
      phone: parsed.phone || null,
      emergencyContact: parsed.emergencyContact || null,
      emergencyContactName: parsed.emergencyContactName || null,
      emergencyContactRelation: parsed.emergencyContactRelation || null,
      personalEmail: parsed.personalEmail || null,
      companyEmail: parsed.companyEmail || null,
      linkedInUrl: parsed.linkedInUrl || null,
      currentAddress: parsed.currentAddress || null,
      permanentAddress: parsed.permanentAddress || null,
      city: parsed.city || null,
      country: parsed.country || null,
      postalCode: parsed.postalCode || null,
      departmentId: parsed.departmentId ? Number(parsed.departmentId) : null,
      designationId: parsed.designationId ? Number(parsed.designationId) : null,
      managerId: parsed.managerId ? Number(parsed.managerId) : null,
      employmentType: parsed.employmentType,
      joiningDate: parsed.joiningDate ? new Date(parsed.joiningDate) : null,
      confirmationDate: parsed.confirmationDate ? new Date(parsed.confirmationDate) : null,
      probationStatus: parsed.probationStatus,
      workLocation: parsed.workLocation || null,
      branch: parsed.branch || null,
      officeFloor: parsed.officeFloor || null,
      deskNumber: parsed.deskNumber || null,
      shiftId: parsed.shiftId ? Number(parsed.shiftId) : null,
      basicSalary: parsed.basicSalary ? Number(parsed.basicSalary) : null,
      bankName: parsed.bankName || null,
      accountNumber: parsed.accountNumber || null,
      iban: parsed.iban || null,
      taxNumber: parsed.taxNumber || null,
      status: parsed.status,
      notes: parsed.notes || null,
      fingerprintEnrolled: false,
    },
  });

  // Auto-push to ZKTeco machine (fire and forget — don't block employee creation)
  const fullName = `${parsed.firstName} ${parsed.lastName}`;
  const uid = parseInt(empId.replace(/^IKIA|^EMP/i, "").replace("-", ""));
  pushUserToZK(uid, empId, fullName).catch(() => {});

  revalidatePath("/hrm/employees");
  revalidatePath("/admin/users");
  redirect("/hrm/employees");
}

export async function updateEmployee(id: number, formData: FormData) {
  await requireUser();
  const raw = {
    firstName: fd(formData, "firstName") ?? "",
    lastName: fd(formData, "lastName") ?? "",
    fatherName: fd(formData, "fatherName"),
    cnic: fd(formData, "cnic"),
    passportNumber: fd(formData, "passportNumber"),
    dateOfBirth: fd(formData, "dateOfBirth"),
    gender: fd(formData, "gender") as "MALE" | "FEMALE" | "OTHER" | undefined,
    maritalStatus: fd(formData, "maritalStatus") as "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | undefined,
    bloodGroup: fd(formData, "bloodGroup"),
    nationality: fd(formData, "nationality"),
    religion: fd(formData, "religion"),
    phone: fd(formData, "phone"),
    emergencyContact: fd(formData, "emergencyContact"),
    emergencyContactName: fd(formData, "emergencyContactName"),
    emergencyContactRelation: fd(formData, "emergencyContactRelation"),
    personalEmail: fd(formData, "personalEmail"),
    companyEmail: fd(formData, "companyEmail"),
    linkedInUrl: fd(formData, "linkedInUrl"),
    currentAddress: fd(formData, "currentAddress"),
    permanentAddress: fd(formData, "permanentAddress"),
    city: fd(formData, "city"),
    country: fd(formData, "country"),
    postalCode: fd(formData, "postalCode"),
    departmentId: fd(formData, "departmentId"),
    designationId: fd(formData, "designationId"),
    managerId: fd(formData, "managerId"),
    employmentType: (fd(formData, "employmentType") ?? "FULL_TIME") as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "FREELANCE",
    joiningDate: fd(formData, "joiningDate"),
    confirmationDate: fd(formData, "confirmationDate"),
    probationStatus: (fd(formData, "probationStatus") ?? "ON_PROBATION") as "ON_PROBATION" | "CONFIRMED" | "EXTENDED",
    workLocation: fd(formData, "workLocation"),
    branch: fd(formData, "branch"),
    officeFloor: fd(formData, "officeFloor"),
    deskNumber: fd(formData, "deskNumber"),
    shiftId: fd(formData, "shiftId"),
    basicSalary: fd(formData, "basicSalary"),
    bankName: fd(formData, "bankName"),
    accountNumber: fd(formData, "accountNumber"),
    iban: fd(formData, "iban"),
    taxNumber: fd(formData, "taxNumber"),
    status: (fd(formData, "status") ?? "ACTIVE") as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED" | "RESIGNED",
    notes: fd(formData, "notes"),
  };
  const parsed = EmployeeSchema.parse(raw);

  await prisma.hRMEmployee.update({
    where: { id },
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      fatherName: parsed.fatherName || null,
      cnic: parsed.cnic || null,
      passportNumber: parsed.passportNumber || null,
      dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
      gender: parsed.gender ?? null,
      maritalStatus: parsed.maritalStatus ?? null,
      bloodGroup: parsed.bloodGroup || null,
      nationality: parsed.nationality || null,
      religion: parsed.religion || null,
      phone: parsed.phone || null,
      emergencyContact: parsed.emergencyContact || null,
      emergencyContactName: parsed.emergencyContactName || null,
      emergencyContactRelation: parsed.emergencyContactRelation || null,
      personalEmail: parsed.personalEmail || null,
      companyEmail: parsed.companyEmail || null,
      linkedInUrl: parsed.linkedInUrl || null,
      currentAddress: parsed.currentAddress || null,
      permanentAddress: parsed.permanentAddress || null,
      city: parsed.city || null,
      country: parsed.country || null,
      postalCode: parsed.postalCode || null,
      departmentId: parsed.departmentId ? Number(parsed.departmentId) : null,
      designationId: parsed.designationId ? Number(parsed.designationId) : null,
      managerId: parsed.managerId ? Number(parsed.managerId) : null,
      employmentType: parsed.employmentType,
      joiningDate: parsed.joiningDate ? new Date(parsed.joiningDate) : null,
      confirmationDate: parsed.confirmationDate ? new Date(parsed.confirmationDate) : null,
      probationStatus: parsed.probationStatus,
      workLocation: parsed.workLocation || null,
      branch: parsed.branch || null,
      officeFloor: parsed.officeFloor || null,
      deskNumber: parsed.deskNumber || null,
      shiftId: parsed.shiftId ? Number(parsed.shiftId) : null,
      basicSalary: parsed.basicSalary ? Number(parsed.basicSalary) : null,
      bankName: parsed.bankName || null,
      accountNumber: parsed.accountNumber || null,
      iban: parsed.iban || null,
      taxNumber: parsed.taxNumber || null,
      status: parsed.status,
      notes: parsed.notes || null,
    },
  });
  revalidatePath("/hrm/employees");
  revalidatePath(`/hrm/employees/${id}`);
  redirect(`/hrm/employees/${id}`);
}

export async function deleteEmployee(id: number) {
  await requireUser();
  await prisma.hRMEmployee.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/hrm/employees");
  redirect("/hrm/employees");
}
