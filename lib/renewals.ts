import { prisma } from "@/lib/prisma";
import { clientScopeWhere } from "@/lib/scope";

/**
 * All active recurring services with a renewal date (hosting, domain, SEO,
 * etc. — whichever ServiceTypes are marked isRecurring), soonest due first.
 * Pass `limit` for a short "latest renewals" preview (dashboard widget);
 * omit it for the full list (the Renewals page).
 */
export async function getRenewals(scope: ReturnType<typeof clientScopeWhere>, limit?: number) {
  return prisma.clientService.findMany({
    where: {
      client: scope,
      endDate: { not: null },
      serviceType: { isRecurring: true },
      status: "active",
    },
    include: { client: true, serviceType: true },
    orderBy: { endDate: "asc" },
    take: limit,
  });
}
