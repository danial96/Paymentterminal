import { NextRequest, NextResponse } from "next/server";
import { searchClients, ClientFilters } from "@/app/actions/clients";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fmt(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB");
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: ClientFilters = {
    q: sp.get("q") ?? undefined,
    brand: sp.get("brand") ?? undefined,
    serviceType: sp.get("serviceType") ?? undefined,
    frontSeller: sp.get("frontSeller") ?? undefined,
    pm: sp.get("pm") ?? undefined,
    remaining: (sp.get("remaining") as "has" | "paid") || undefined,
    dateFrom: sp.get("dateFrom") ?? undefined,
    dateTo: sp.get("dateTo") ?? undefined,
    dueStatus: (sp.get("dueStatus") as "overdue" | "soon") || undefined,
  };

  const clients = await searchClients(filters);

  const header = [
    "Date", "Name", "Email", "Phone", "Brand",
    "Services", "Paid (£)", "Remaining (£)", "Due Date",
    "Front Seller", "Upseller", "PM", "Medium", "Notes",
  ];

  const rows = clients.map((c) => {
    const services = c.services.map((s) =>
      s.serviceType.isRecurring && s.durationYears
        ? `${s.serviceType.name} (${s.durationYears}yr)`
        : s.serviceType.name
    ).join("; ");

    const paid = c.services.reduce(
      (sum, s) => sum + s.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0
    );
    const total = c.services.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const remaining = total - paid;

    const endDates = c.services.map((s) => s.endDate).filter(Boolean) as Date[];
    const dueDate = endDates.length > 0 ? endDates.reduce((a, b) => (a < b ? a : b)) : null;

    // front seller: first service without upsellerName
    const frontSeller = c.services.find((s) => !s.upsellerName && s.soldByName)?.soldByName ?? "";

    // upsellers: unique names from upsellerName fields
    const upsellers = Array.from(new Set(
      c.services.flatMap((s) => [s.upsellerName]).filter(Boolean) as string[]
    )).join("; ");

    const saleDate = c.services[0]?.saleDate ? fmt(c.services[0].saleDate) : "";

    return [
      saleDate,
      c.name,
      c.email ?? "",
      c.phone ?? "",
      c.brand?.name ?? "",
      services,
      paid.toFixed(2),
      remaining > 0 ? remaining.toFixed(2) : "0.00",
      dueDate ? fmt(dueDate) : "",
      frontSeller || c.frontSeller?.name || "",
      upsellers,
      c.projectManager?.name ?? c.pmName ?? "",
      c.medium ?? "",
      c.notes ?? "",
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((v) => csvEscape(String(v))).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=clients.csv",
    },
  });
}
