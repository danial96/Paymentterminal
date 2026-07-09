import { prisma } from "@/lib/prisma";
import { requireUser, clientScopeWhere } from "@/lib/scope";
import { notFound } from "next/navigation";
import Link from "next/link";

const BRAND_COLORS: Record<string, string> = {
  "digi design lab":       "bg-teal-100 text-teal-800 ring-1 ring-teal-300",
  "alpha web creators":    "bg-lime-100 text-lime-800 ring-1 ring-lime-300",
  "elite design hub":      "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
  "creative web codes":    "bg-pink-100 text-pink-800 ring-1 ring-pink-300",
  "stellar web design":    "bg-sky-100 text-sky-800 ring-1 ring-sky-300",
  "stellar web designs":   "bg-sky-100 text-sky-800 ring-1 ring-sky-300",
  "omni web creators":     "bg-purple-100 text-purple-800 ring-1 ring-purple-300",
  "olenix web solutions":  "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300",
  "imagine web studio":    "bg-violet-100 text-violet-800 ring-1 ring-violet-300",
  "craft vision digital":  "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300",
  "craft tide":            "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300",
  "web vision studios":    "bg-orange-100 text-orange-800 ring-1 ring-orange-300",
  "design vertex":         "bg-violet-100 text-violet-800 ring-1 ring-violet-300",
};

function brandColor(name: string): string {
  const key = name.toLowerCase();
  if (BRAND_COLORS[key]) return BRAND_COLORS[key];
  for (const [k, v] of Object.entries(BRAND_COLORS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  const fallbacks = [
    "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
    "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
    "bg-violet-100 text-violet-800 ring-1 ring-violet-300",
    "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
    "bg-pink-100 text-pink-800 ring-1 ring-pink-300",
    "bg-orange-100 text-orange-800 ring-1 ring-orange-300",
    "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300",
    "bg-teal-100 text-teal-800 ring-1 ring-teal-300",
  ];
  return fallbacks[name.charCodeAt(0) % fallbacks.length];
}

const SERVICE_COLORS: Record<string, string> = {
  website:  "bg-blue-50 text-blue-700",
  hosting:  "bg-emerald-50 text-emerald-700",
  domain:   "bg-violet-50 text-violet-700",
  seo:      "bg-amber-50 text-amber-700",
  graphic:  "bg-pink-50 text-pink-700",
  cv:       "bg-orange-50 text-orange-700",
  email:    "bg-cyan-50 text-cyan-700",
  security: "bg-red-50 text-red-700",
  gmb:      "bg-teal-50 text-teal-700",
  social:   "bg-fuchsia-50 text-fuchsia-700",
};

function serviceColor(name: string): string {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(SERVICE_COLORS)) {
    if (key.includes(k)) return v;
  }
  const fallbacks = [
    "bg-blue-50 text-blue-700", "bg-emerald-50 text-emerald-700",
    "bg-violet-50 text-violet-700", "bg-amber-50 text-amber-700",
  ];
  return fallbacks[name.charCodeAt(0) % fallbacks.length];
}

export default async function BrandClientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brandId = Number(id);
  if (isNaN(brandId)) notFound();

  const user = await requireUser();
  const scope = clientScopeWhere(user);

  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) notFound();

  const clients = await prisma.client.findMany({
    where: { ...scope, brandId, deletedAt: null },
    include: {
      projectManager: true,
      services: {
        where: { deletedAt: null },
        select: { serviceType: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const color = brandColor(brand.name);

  // Stats
  const totalServices = clients.reduce((s, c) => s + c.services.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients" className="text-sm text-zinc-400 hover:text-zinc-700">
          ← Clients
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <span className={`rounded-xl px-4 py-2 text-lg font-bold ${color}`}>
          {brand.name}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Total Clients</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{clients.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Total Services</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{totalServices}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Avg Services / Client</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {clients.length ? (totalServices / clients.length).toFixed(1) : "0"}
          </p>
        </div>
      </div>

      {/* Clients table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">All Clients</p>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <th className="border-r border-zinc-200 px-4 py-2">Name</th>
              <th className="border-r border-zinc-200 px-4 py-2">Phone</th>
              <th className="border-r border-zinc-200 px-4 py-2">Services</th>
              <th className="border-r border-zinc-200 px-4 py-2">PM</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="border-r border-zinc-100 px-4 py-6 text-center text-zinc-400">
                  No clients for this brand
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="border-r border-zinc-100 px-4 py-2">
                  <Link href={`/clients/${c.id}`} className="font-medium text-zinc-900 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="border-r border-zinc-100 px-4 py-2 text-zinc-500">{c.phone ?? "—"}</td>
                <td className="border-r border-zinc-100 px-4 py-2">
                  {c.services.length === 0 ? (
                    <span className="text-zinc-300">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(c.services.map((s) => s.serviceType.name))).map((svcName) => (
                        <span key={svcName} className={`rounded-full px-2 py-0.5 text-xs font-medium ${serviceColor(svcName)}`}>
                          {svcName}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="border-r border-zinc-100 px-4 py-2 text-zinc-600">{c.projectManager?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
