import { prisma } from "@/lib/prisma";
import { requireUser, clientScopeWhere } from "@/lib/scope";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function BrandClientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brandId = Number(id);
  if (isNaN(brandId)) notFound();

  const user = await requireUser();
  const scope = clientScopeWhere(user as { id: string; role: string });

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

  const totalServices = clients.reduce((s, c) => s + c.services.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/clients" className="text-sm text-zinc-400 hover:text-zinc-700">
          ← Clients
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-lg font-bold text-zinc-900">
          {brand.name}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Clients", value: clients.length },
          { label: "Total Services", value: totalServices },
          { label: "Avg Services / Client", value: clients.length ? (totalServices / clients.length).toFixed(1) : "0" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Clients table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">All Clients</p>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Services</th>
              <th className="px-4 py-2">PM</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  No clients for this brand
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-2">
                  <Link href={`/clients/${c.id}`} className="font-medium text-zinc-900 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-500">{c.phone ?? "—"}</td>
                <td className="px-4 py-2">
                  {c.services.length === 0 ? (
                    <span className="text-zinc-300">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(c.services.map((s) => s.serviceType.name))).map((svcName) => (
                        <span key={svcName} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          {svcName}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-600">{c.projectManager?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
