import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import PayrollClient from "./PayrollClient";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; emp?: string }>;
}) {
  await requireUser();
  const now = new Date();
  const { month, year, emp } = await searchParams;
  const filterMonth = month ? Number(month) : now.getMonth() + 1;
  const filterYear = year ? Number(year) : now.getFullYear();

  const [payrolls, employees, requests] = await Promise.all([
    prisma.hRMPayroll.findMany({
      where: {
        month: filterMonth,
        year: filterYear,
        ...(emp ? { employeeId: Number(emp) } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { employee: { include: { designation: true } } },
    }),
    prisma.hRMEmployee.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: {
        id: true, firstName: true, lastName: true, basicSalary: true,
        designation: { select: { name: true } },
        department:  { select: { name: true } },
        allowances:  { where: { isActive: true }, select: { amount: true } },
        deductions:  { where: { isActive: true }, select: { amount: true } },
      },
      orderBy: { firstName: "asc" },
    }),
    prisma.hRMPayslipRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
    }),
  ]);

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="space-y-5">
      <PayrollClient
        employees={employees as any}
        payrolls={payrolls as any}
        requests={requests.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })) as any}
        filterMonth={filterMonth}
        filterYear={filterYear}
        pendingCount={pendingCount}
      />
    </div>
  );
}
