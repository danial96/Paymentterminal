import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export async function POST() {
  await requireUser();

  await prisma.hRMPayrollItem.deleteMany({});
  const payrolls = await prisma.hRMPayroll.deleteMany({});
  const requests = await prisma.hRMPayslipRequest.deleteMany({});

  return NextResponse.json({
    ok: true,
    deleted: { payrolls: payrolls.count, payslipRequests: requests.count },
  });
}
