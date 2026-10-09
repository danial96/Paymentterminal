import { prisma } from "@/lib/prisma";
import { clientScopeWhere } from "@/lib/scope";

export type MonthlyBreakdownRow = {
  label: string;
  sales: number;
  paid: number;
  remaining: number;
  count: number;
};

/**
 * Builds a month-by-month sales/payments/remaining breakdown.
 * - `monthsBack` limits it to the last N months (for the dashboard widget).
 * - Omit `monthsBack` to cover every month that has data, starting from the
 *   earliest sale on record (for the full Monthly Sales page).
 * Ordered oldest -> newest.
 */
export async function getMonthlyBreakdown(
  scope: ReturnType<typeof clientScopeWhere>,
  monthsBack?: number
): Promise<MonthlyBreakdownRow[]> {
  const now = new Date();
  const endOfCurrentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );

  let startDate: Date;
  if (monthsBack) {
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsBack - 1), 1));
  } else {
    const earliest = await prisma.clientService.findFirst({
      where: { client: scope },
      orderBy: { saleDate: "asc" },
      select: { saleDate: true },
    });
    startDate = earliest
      ? new Date(Date.UTC(earliest.saleDate.getUTCFullYear(), earliest.saleDate.getUTCMonth(), 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  // Fetch all services to find the latest service per client (for remaining calc)
  const allServicesForScope = await prisma.clientService.findMany({
    where: { client: { ...scope, deletedAt: null }, deletedAt: null },
    select: { id: true, clientId: true, saleDate: true },
    orderBy: { saleDate: "desc" },
  });
  const latestServiceIdByClient = new Map<number, number>();
  for (const s of allServicesForScope) {
    if (!latestServiceIdByClient.has(s.clientId)) {
      latestServiceIdByClient.set(s.clientId, s.id);
    }
  }

  const [services, payments] = await Promise.all([
    prisma.clientService.findMany({
      where: { client: { ...scope, deletedAt: null }, deletedAt: null, saleDate: { gte: startDate, lte: endOfCurrentMonth } },
      select: { id: true, clientId: true, saleDate: true, totalAmount: true, payments: { where: { deletedAt: null }, select: { amount: true } } },
    }),
    prisma.payment.findMany({
      where: {
        deletedAt: null,
        clientService: { deletedAt: null, client: { ...scope, deletedAt: null } },
        paymentDate: { gte: startDate, lte: endOfCurrentMonth },
      },
      select: { paymentDate: true, amount: true },
    }),
  ]);

  const months: { year: number; month: number }[] = [];
  let cursor = new Date(startDate);
  const endCursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  while (cursor <= endCursor) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  return months.map(({ year, month }) => {
    const monthDate = new Date(Date.UTC(year, month, 1));
    const label = monthDate.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const servicesInMonth = services.filter(
      (s) => s.saleDate.getUTCFullYear() === year && s.saleDate.getUTCMonth() === month
    );
    const sales = servicesInMonth.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const remaining = servicesInMonth.reduce((sum, s) => {
      // Only count remaining for the client's latest service entry
      if (latestServiceIdByClient.get(s.clientId) !== s.id) return sum;
      const paid = s.payments.reduce((p, pay) => p + Number(pay.amount), 0);
      return sum + (Number(s.totalAmount) - paid);
    }, 0);
    const paid = payments
      .filter(
        (p) => p.paymentDate.getUTCFullYear() === year && p.paymentDate.getUTCMonth() === month
      )
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { label, sales, paid, remaining, count: servicesInMonth.length };
  });
}
