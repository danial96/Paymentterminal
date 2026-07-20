import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
  restoreClient, restoreService, restorePayment,
  permanentDeleteClient, permanentDeleteService, permanentDeletePayment,
} from "@/app/actions/trash";
import TrashRow from "./TrashRow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export default async function TrashPage() {
  const [clients, services, payments] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.clientService.findMany({
      where: { deletedAt: { not: null } },
      include: { client: true, serviceType: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { deletedAt: { not: null } },
      include: { clientService: { include: { client: true } } },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  const total = clients.length + services.length + payments.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900"><FontAwesomeIcon icon={faTrash} className="mr-2 h-5 w-5" />Trash</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          {total} item{total !== 1 ? "s" : ""} in trash — restore or permanently delete
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 py-16 text-center text-sm text-zinc-400">
          Trash is empty
        </div>
      )}

      {/* Clients */}
      {clients.length > 0 && (
        <Section title="Clients" count={clients.length}>
          {clients.map((c) => (
            <TrashRow
              key={c.id}
              title={c.name}
              subtitle={[c.email, c.phone].filter(Boolean).join(" · ")}
              deletedAt={c.deletedAt!}
              restoreAction={restoreClient.bind(null, c.id)}
              deleteAction={permanentDeleteClient.bind(null, c.id)}
              deleteLabel={`Permanently delete client "${c.name}" and ALL their services & payments?`}
            />
          ))}
        </Section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <Section title="Services" count={services.length}>
          {services.map((s) => (
            <TrashRow
              key={s.id}
              title={s.serviceType.name}
              subtitle={`${s.client.name} · £${Number(s.totalAmount).toFixed(2)} · ${formatDate(s.saleDate)}`}
              deletedAt={s.deletedAt!}
              restoreAction={restoreService.bind(null, s.id)}
              deleteAction={permanentDeleteService.bind(null, s.id)}
              deleteLabel={`Permanently delete this service?`}
            />
          ))}
        </Section>
      )}

      {/* Payments */}
      {payments.length > 0 && (
        <Section title="Payments" count={payments.length}>
          {payments.map((p) => (
            <TrashRow
              key={p.id}
              title={`£${Number(p.amount).toFixed(2)}${p.note ? ` — ${p.note}` : ""}`}
              subtitle={`${p.clientService.client.name} · ${formatDate(p.paymentDate)}`}
              deletedAt={p.deletedAt!}
              restoreAction={restorePayment.bind(null, p.id)}
              deleteAction={permanentDeletePayment.bind(null, p.id)}
              deleteLabel={`Permanently delete this payment?`}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-700">
        {title} <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{count}</span>
      </h2>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
        {children}
      </div>
    </div>
  );
}
