import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/format";
import { auth } from "@/lib/auth";
import { triggerSync } from "@/app/actions/sync";
import { trashClient, trashService, trashPayment } from "@/app/actions/trash";
import AddServiceModal from "./AddServiceModal";
import LogPaymentModal from "./LogPaymentModal";
import RenewModal from "./RenewModal";
import TrashClientButton from "./TrashClientButton";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);

  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const [client, serviceTypes] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId, deletedAt: null },
      include: {
        brand: true,
        frontSeller: true,
        projectManager: true,
        services: {
          where: { deletedAt: null },
          include: {
            serviceType: true,
            soldBy: true,
            upseller: true,
            payments: {
              where: { deletedAt: null },
              orderBy: { paymentDate: "desc" },
            },
          },
          orderBy: { saleDate: "desc" },
        },
      },
    }),
    prisma.serviceType.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-semibold text-zinc-900">{client.name}</h1>
          <div className="flex items-center gap-2">
            <form action={triggerSync}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Sync from Sheet
              </button>
            </form>
            <AddServiceModal clientId={client.id} serviceTypes={serviceTypes} />
            {isAdmin && (
              <TrashClientButton
                action={trashClient.bind(null, client.id)}
                clientName={client.name}
              />
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <Info label="Email" value={client.email} />
          <Info label="Phone" value={client.phone} />
          <Info label="Medium" value={client.medium} />
          <Info label="Brand" value={client.brand?.name} />
          <Info label="Front Seller" value={client.frontSeller?.name ?? client.frontSellerName} />
          <Info label="Project Manager" value={client.projectManager?.name} />
        </div>
        {client.notes && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-600">{client.notes}</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-900">Services</h2>
        {client.services.length === 0 && (
          <p className="text-sm text-zinc-400">No services sold yet.</p>
        )}
        {client.services.map((service) => {
          const paid = service.payments.reduce((sum, p) => sum + Number(p.amount), 0);
          const remaining = Number(service.totalAmount) - paid;
          return (
            <div key={service.id} className="rounded-lg border border-zinc-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{service.serviceType.name}</p>
                  {service.description && (
                    <p className="text-sm text-zinc-500">{service.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-600">
                    {service.status}
                  </span>
                  {isAdmin && (
                    <form action={trashService.bind(null, service.id, client.id)}>
                      <button
                        type="submit"
                        title="Move to trash"
                        className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                      >
                        🗑
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                <Info label="Total" value={`£${Number(service.totalAmount).toFixed(2)}`} />
                <Info label="Paid" value={`£${paid.toFixed(2)}`} />
                <Info label="Remaining" value={`£${remaining.toFixed(2)}`} />
                <Info label="Sale Date" value={formatDate(service.saleDate)} />
                <Info label="Sold By" value={service.soldBy?.name ?? service.soldByName} />
                <Info label="Upsold By" value={service.upseller?.name ?? service.upsellerName} />
                {service.endDate && (
                  <Info label="Renewal Due" value={formatDate(service.endDate)} />
                )}
              </div>

              {service.payments.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                    Payment History
                  </p>
                  <ul className="flex flex-col gap-1 text-sm text-zinc-600">
                    {service.payments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between">
                        <span>
                          {formatDate(p.paymentDate)} {p.note ? `— ${p.note}` : ""}
                        </span>
                        <div className="flex items-center gap-3">
                          <span>£{Number(p.amount).toFixed(2)}</span>
                          {isAdmin && (
                            <form action={trashPayment.bind(null, p.id, client.id)}>
                              <button
                                type="submit"
                                title="Move payment to trash"
                                className="text-zinc-300 hover:text-red-500 transition-colors"
                              >
                                🗑
                              </button>
                            </form>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <LogPaymentModal clientId={client.id} clientServiceId={service.id} />
                {service.serviceType.isRecurring && (
                  <RenewModal clientId={client.id} clientServiceId={service.id} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-zinc-900">{value || "—"}</p>
    </div>
  );
}
