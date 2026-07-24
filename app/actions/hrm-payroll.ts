"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export async function generatePayroll(formData: FormData) {
  const user = await requireUser();
  const employeeId = Number(formData.get("employeeId"));
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const bonuses = Number(formData.get("bonuses") ?? 0);
  const commission = Number(formData.get("commission") ?? 0);
  const overtimePay = Number(formData.get("overtimePay") ?? 0);
  const taxDeduction = Number(formData.get("taxDeduction") ?? 0);
  const pfDeduction = Number(formData.get("pfDeduction") ?? 0);
  const eobiDeduction = Number(formData.get("eobiDeduction") ?? 0);
  const loanDeduction = Number(formData.get("loanDeduction") ?? 0);
  const advanceDeduction = Number(formData.get("advanceDeduction") ?? 0);
  const otherDeductions = Number(formData.get("otherDeductions") ?? 0);
  const notes = formData.get("notes") ? String(formData.get("notes")) : null;

  const employee = await prisma.hRMEmployee.findUnique({
    where: { id: employeeId },
    include: { allowances: { where: { isActive: true } }, deductions: { where: { isActive: true } } },
  });
  if (!employee) throw new Error("Employee not found");

  const basicSalary = Number(employee.basicSalary ?? 0);

  // Calculate attendance-based deductions
  const attendanceRecords = await prisma.hRMAttendance.findMany({
    where: {
      employeeId,
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
  });
  const absentDays = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const lateDays = attendanceRecords.filter((a) => a.status === "LATE").length;
  const perDaySalary = basicSalary / 30;
  const absentDeduction = absentDays * perDaySalary;
  const lateDeduction = lateDays * (perDaySalary / 2); // half-day deduction per late

  // Allowances
  const recurringAllowances = employee.allowances.reduce((sum, a) => sum + Number(a.amount), 0);
  const totalAllowances = recurringAllowances;

  // Recurring deductions
  const recurringDeductions = employee.deductions.reduce((sum, d) => sum + Number(d.amount), 0);

  const grossSalary = basicSalary + totalAllowances + bonuses + commission + overtimePay;
  const totalDeductions = taxDeduction + pfDeduction + eobiDeduction + loanDeduction + advanceDeduction + lateDeduction + absentDeduction + otherDeductions + recurringDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  const payroll = await prisma.hRMPayroll.upsert({
    where: { employeeId_month_year: { employeeId, month, year } },
    create: {
      employeeId,
      month,
      year,
      basicSalary,
      allowances: totalAllowances,
      bonuses,
      overtime: overtimePay,
      commission,
      grossSalary,
      taxDeduction,
      pfDeduction,
      eobiDeduction,
      loanDeduction,
      advanceDeduction,
      lateDeduction,
      absentDeduction,
      otherDeductions,
      totalDeductions,
      netSalary,
      status: "DRAFT",
      notes,
      generatedById: Number(user.id),
      generatedAt: new Date(),
    },
    update: {
      basicSalary,
      allowances: totalAllowances,
      bonuses,
      overtime: overtimePay,
      commission,
      grossSalary,
      taxDeduction,
      pfDeduction,
      eobiDeduction,
      loanDeduction,
      advanceDeduction,
      lateDeduction,
      absentDeduction,
      otherDeductions,
      totalDeductions,
      netSalary,
      notes,
      generatedById: Number(user.id),
      generatedAt: new Date(),
    },
  });

  // Create payroll items
  await prisma.hRMPayrollItem.deleteMany({ where: { payrollId: payroll.id } });
  const items = [
    ...employee.allowances.map((a) => ({ type: "allowance", label: a.name, amount: Number(a.amount) })),
    ...(bonuses > 0 ? [{ type: "bonus", label: "Bonus", amount: bonuses }] : []),
    ...(overtimePay > 0 ? [{ type: "overtime", label: "Overtime Pay", amount: overtimePay }] : []),
    ...(commission > 0 ? [{ type: "commission", label: "Commission", amount: commission }] : []),
    ...employee.deductions.map((d) => ({ type: "deduction", label: d.name, amount: Number(d.amount) })),
    ...(taxDeduction > 0 ? [{ type: "deduction", label: "Tax", amount: taxDeduction }] : []),
    ...(pfDeduction > 0 ? [{ type: "deduction", label: "Provident Fund", amount: pfDeduction }] : []),
    ...(eobiDeduction > 0 ? [{ type: "deduction", label: "EOBI", amount: eobiDeduction }] : []),
    ...(loanDeduction > 0 ? [{ type: "deduction", label: "Loan Deduction", amount: loanDeduction }] : []),
    ...(advanceDeduction > 0 ? [{ type: "deduction", label: "Advance Deduction", amount: advanceDeduction }] : []),
    ...(lateDeduction > 0 ? [{ type: "deduction", label: `Late Deduction (${lateDays} days)`, amount: lateDeduction }] : []),
    ...(absentDeduction > 0 ? [{ type: "deduction", label: `Absent Deduction (${absentDays} days)`, amount: absentDeduction }] : []),
    ...(otherDeductions > 0 ? [{ type: "deduction", label: "Other Deductions", amount: otherDeductions }] : []),
  ];
  if (items.length > 0) {
    await prisma.hRMPayrollItem.createMany({ data: items.map((i) => ({ payrollId: payroll.id, ...i })) });
  }

  revalidatePath("/hrm/payroll");
}

export async function approvePayroll(id: number) {
  await requireUser();
  await prisma.hRMPayroll.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/hrm/payroll");
}

export async function markPayrollPaid(id: number) {
  await requireUser();
  await prisma.hRMPayroll.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  revalidatePath("/hrm/payroll");
  revalidatePath(`/hrm/payroll/${id}`);
}

export async function deletePayroll(id: number) {
  await requireUser();
  await prisma.hRMPayroll.delete({ where: { id } });
  revalidatePath("/hrm/payroll");
  redirect("/hrm/payroll");
}
