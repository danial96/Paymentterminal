import { prisma } from "@/lib/prisma";
import { fetchDealRows } from "@/lib/googleSheets";
import { classifyServiceCategory } from "@/lib/serviceCategory";
import { createHash } from "crypto";

// Sheet is fetched with valueRenderOption=UNFORMATTED_VALUE, so a properly-typed
// numeric cell arrives as an exact JS number — no rounding-display bug (a cell
// showing "£463" can actually be stored as 462.5; reading the display text would
// silently lose that 50p). Only cells someone typed as literal text (e.g. "£308.33"
// typed directly, bypassing currency formatting) arrive as a string, requiring the
// regex fallback below.
function parseAmount(v: string | number): number {
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Sheet dates are UK format (DD/MM/YYYY). A properly-typed date cell arrives
// (via UNFORMATTED_VALUE) as a Google Sheets serial number — days since the
// 1899-12-30 epoch — parsed directly below, avoiding any string ambiguity.
// Only text-typed date cells fall back to explicit DD/MM/YYYY regex parsing,
// since JS's Date constructor assumes MM/DD/YYYY for slash-separated strings
// and silently misreads or invalidates them (e.g. "15/06/2026" -> Invalid Date).
// Both paths build with Date.UTC (not the local-time constructor) so the
// calendar day survives storage — a local-midnight Date shifts to the previous
// day once converted to UTC in a timezone ahead of UTC (e.g. Pakistan, UTC+5).
const SHEETS_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

function parseDate(v: string | number): Date | null {
  if (typeof v === "number") {
    const d = new Date(SHEETS_EPOCH_UTC_MS + v * 86400000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (!v) return null;
  const trimmed = v.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDurationYears(service: string): number | null {
  const match = service.match(/(\d+)\s*year/i);
  return match ? Number(match[1]) : null;
}

function addYears(date: Date, years: number) {
  const d = new Date(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

async function findUserByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return prisma.user.findFirst({
    where: { name: { equals: trimmed } },
  });
}

const INSTALLMENT_SUFFIX = /\s*\((partial|remaining)\)\s*$/i;

/** Strips a trailing "(Partial)"/"(Remaining)" tag, returning the base deal name and which tag (if any). */
function splitInstallment(serviceName: string): { base: string; installment: "partial" | "remaining" | null } {
  const match = serviceName.match(INSTALLMENT_SUFFIX);
  if (!match) return { base: serviceName, installment: null };
  return {
    base: serviceName.replace(INSTALLMENT_SUFFIX, "").trim(),
    installment: match[1].toLowerCase() as "partial" | "remaining",
  };
}

/**
 * Stable content-based key for a (client, service) deal — deliberately NOT based on
 * sheet row number, because the team inserts section-divider rows (e.g. "June 2026")
 * which shifts every row number below them, silently reattaching payments to the
 * wrong client on the next sync if row number were used as the identity.
 */
function serviceKey(sheetId: string, clientId: number, baseServiceName: string) {
  const hash = createHash("sha1").update(baseServiceName.toLowerCase().trim()).digest("hex").slice(0, 16);
  return `sheet:${sheetId}:client${clientId}:svc:${hash}`;
}

function paymentKey(serviceKeyValue: string, installment: "partial" | "remaining" | "main") {
  return `${serviceKeyValue}:${installment}`;
}

/**
 * "Number of Accounts" business rule (per user): a service counts as a NEW
 * account only if it's a genuine new website/combo-package sale, not a
 * continuation of an existing one and not a hosting-led deal that merely
 * mentions "website" in passing (e.g. bundled "website maintenance").
 * - Any mention of "remaining" anywhere in the raw text excludes it, even if
 *   it wasn't cleanly tagged "(Remaining)" (e.g. "(Remaining £149 ... )").
 * - "combo" always counts (a combo package is inherently a new deal).
 * - Otherwise counts only if "website" appears and either "hosting" doesn't
 *   appear at all, or "website" appears before "hosting" — i.e. website is
 *   the primary subject, not a bundled extra on a hosting-led deal.
 */
function isNewAccountDeal(rawServiceText: string): boolean {
  const text = rawServiceText.toLowerCase();
  if (text.includes("remaining")) return false;
  if (text.includes("combo")) return true;
  const websiteIdx = text.indexOf("website");
  if (websiteIdx === -1) return false;
  const hostingIdx = text.indexOf("hosting");
  return hostingIdx === -1 || websiteIdx < hostingIdx;
}

/**
 * Never creates a ServiceType — only admins add those (Admin > Service Types).
 * Matching order:
 *   1. Exact name match (case-insensitive)
 *   2. Service type name is a keyword inside the sheet text (e.g. "CV" in "CV Design")
 *   3. Classified category match
 *   4. Fallback to "other"
 */
function resolveServiceType(
  serviceName: string,
  allTypes: { id: number; name: string; isRecurring: boolean; category: string }[]
) {
  const lower = serviceName.toLowerCase();

  const exact = allTypes.find((t) => t.name.toLowerCase() === lower);
  if (exact) return exact;

  // Keyword match: prefer longer type names first to avoid short names stealing matches.
  // Exclude the catch-all "Other" type itself, but include everything else.
  const matchable = allTypes
    .filter((t) => t.name.toLowerCase() !== "other")
    .sort((a, b) => b.name.length - a.name.length);
  const keyword = matchable.find(
    (t) => lower.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(lower)
  );
  if (keyword) return keyword;

  const category = classifyServiceCategory(serviceName);
  if (category !== "other") {
    const byCategory = allTypes.find((t) => t.category === category);
    if (byCategory) return byCategory;
  }

  return allTypes.find((t) => t.category === "other") ?? null;
}

export async function runSheetSync() {
  const sheetId = process.env.GOOGLE_SHEET_ID ?? "unknown";
  const rows = await fetchDealRows();
  const allServiceTypes = await prisma.serviceType.findMany();

  let clientsCreated = 0;
  let clientsUpdated = 0;
  let servicesUpserted = 0;
  const warnings: string[] = [];

  for (const row of rows) {
    if (!row.clientName.trim()) continue; // skip blank rows

    const saleDate = parseDate(row.date) ?? new Date();
    const amountPaid = parseAmount(row.amountPaid);
    const remaining = parseAmount(row.remainingAmount);
    const totalAmount = amountPaid + remaining;

    const [agent, upseller, pm] = await Promise.all([
      findUserByName(row.agentName),
      findUserByName(row.upseller),
      findUserByName(row.pm),
    ]);

    if (row.agentName.trim() && !agent) {
      warnings.push(`Row ${row.rowNumber}: unmatched Agent Name "${row.agentName}"`);
    }
    if (row.upseller.trim() && !upseller) {
      warnings.push(`Row ${row.rowNumber}: unmatched Upseller "${row.upseller}"`);
    }
    if (row.pm.trim() && !pm) {
      warnings.push(`Row ${row.rowNumber}: unmatched PM "${row.pm}"`);
    }

    let brand = null;
    if (row.brand.trim()) {
      brand = await prisma.brand.upsert({
        where: { name: row.brand.trim() },
        update: {},
        create: { name: row.brand.trim() },
      });
    }

    const email = row.email.trim() || null;
    const phone = row.phone.trim() || null;

    if (!email && !phone) {
      warnings.push(
        `Row ${row.rowNumber}: no email or phone for "${row.clientName}" — client cannot be reliably deduplicated, a new client will be created every sync`
      );
    }

    let client = email
      ? await prisma.client.findFirst({ where: { email } })
      : phone
        ? await prisma.client.findFirst({ where: { phone } })
        : null;

    const clientData = {
      name: row.clientName.trim(),
      email,
      phone,
      brandId: brand?.id ?? null,
      notes: row.notes.trim() || null,
      medium: row.medium.trim() || null,
      projectManagerId: pm?.id ?? null,
      pmName: row.pm.trim() || null,
    };

    if (client) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: clientData,
      });
      clientsUpdated++;
    } else {
      client = await prisma.client.create({
        data: clientData,
      });
      clientsCreated++;
    }

    if (row.service.trim()) {
      const rawService = row.service.trim();
      const { base: serviceName, installment } = splitInstallment(rawService);
      const svcKey = serviceKey(sheetId, client.id, serviceName);
      const paymentExternalRef = paymentKey(svcKey, installment ?? "main");

      // A "(Remaining)" row is a second payment on an already-recorded deal,
      // not a new sale — merge it as a Payment on the matching "(Partial)" service
      // instead of creating a duplicate (which would double-count totals).
      if (installment === "remaining") {
        const existingService = await prisma.clientService.findFirst({
          where: { externalRef: svcKey },
        });

        if (existingService) {
          // Also keep service metadata in sync — soldByName may be null if the
          // service was first created before agent attribution was added to the schema.
          // Use row.agentName directly (the agentName variable is declared later in scope).
          await prisma.clientService.update({
            where: { id: existingService.id },
            data: {
              soldById: agent?.id ?? null,
              soldByName: row.agentName.trim() || null,
              upsellerId: upseller?.id ?? null,
            },
          });
          if (amountPaid > 0) {
            await prisma.payment.upsert({
              where: { externalRef: paymentExternalRef },
              update: {
                clientServiceId: existingService.id,
                amount: amountPaid,
                paymentDate: saleDate,
              },
              create: {
                clientServiceId: existingService.id,
                amount: amountPaid,
                paymentDate: saleDate,
                note: "Remaining payment (synced from Sheet)",
                externalRef: paymentExternalRef,
              },
            });
          }
          continue;
        }

        warnings.push(
          `Row ${row.rowNumber}: "(Remaining)" payment for "${serviceName}" (${client.name}) but no matching earlier service found — recorded as its own service instead`
        );
      }

      const serviceType = resolveServiceType(serviceName, allServiceTypes);

      if (!serviceType) {
        warnings.push(
          `Row ${row.rowNumber}: no matching Service Type for "${serviceName}" — add one in Admin > Service Types, this row was skipped`
        );
        continue;
      }

      const durationYears = serviceType.isRecurring ? parseDurationYears(serviceName) : null;
      const endDate =
        serviceType.isRecurring && durationYears ? addYears(saleDate, durationYears) : null;

      const isNewAccount = isNewAccountDeal(rawService);

      const agentName = row.agentName.trim() || null;

      const clientService = await prisma.clientService.upsert({
        where: { externalRef: svcKey },
        update: {
          clientId: client.id,
          serviceTypeId: serviceType.id,
          upsellerId: upseller?.id ?? null,
          soldById: agent?.id ?? null,
          soldByName: agentName,
          description: serviceName,
          totalAmount,
          saleDate,
          durationYears,
          startDate: serviceType.isRecurring ? saleDate : null,
          endDate,
          isNewAccount,
        },
        create: {
          clientId: client.id,
          serviceTypeId: serviceType.id,
          upsellerId: upseller?.id ?? null,
          soldById: agent?.id ?? null,
          soldByName: agentName,
          description: serviceName,
          totalAmount,
          saleDate,
          durationYears,
          startDate: serviceType.isRecurring ? saleDate : null,
          endDate,
          externalRef: svcKey,
          isNewAccount,
        },
      });
      servicesUpserted++;

      if (amountPaid > 0) {
        await prisma.payment.upsert({
          where: { externalRef: paymentExternalRef },
          update: { clientServiceId: clientService.id, amount: amountPaid, paymentDate: saleDate },
          create: {
            clientServiceId: clientService.id,
            amount: amountPaid,
            paymentDate: saleDate,
            note: "Synced from Sheet",
            externalRef: paymentExternalRef,
          },
        });
      }
    }
  }

  // Front Seller vs Upseller is a position-based rule (per user): whoever is
  // recorded as "Agent" on a client's EARLIEST service is their Front Seller;
  // the agent recorded on every later service is that specific service's
  // Upseller instead. Done as a pass over the final state (not inline during
  // the row loop above) so it's based on actual chronological saleDate order,
  // not sheet row order, and self-heals if an earlier-dated row is added later
  // or a previously-unmatched first agent gets a User account afterward.
  const clientsWithServices = await prisma.client.findMany({
    where: { services: { some: {} } },
    select: {
      id: true,
      services: {
        select: { id: true, saleDate: true, soldById: true, soldByName: true },
        orderBy: { saleDate: "asc" },
      },
    },
  });

  for (const c of clientsWithServices) {
    const [first, ...rest] = c.services;
    await prisma.client.update({
      where: { id: c.id },
      data: { frontSellerId: first.soldById, frontSellerName: first.soldByName },
    });
    for (const svc of rest) {
      await prisma.clientService.update({
        where: { id: svc.id },
        data: { upsellerId: svc.soldById, upsellerName: svc.soldByName },
      });
    }
  }

  const log = await prisma.syncLog.create({
    data: {
      rowsProcessed: rows.length,
      clientsCreated,
      clientsUpdated,
      servicesUpserted,
      warnings,
    },
  });

  return log;
}
