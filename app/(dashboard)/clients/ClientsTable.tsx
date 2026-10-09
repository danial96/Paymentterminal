"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { loadMoreClients } from "@/app/actions/clients";
import { updateClientStatus, type ClientStatusValue } from "@/app/actions/clientStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const STATUS_OPTIONS: { value: ClientStatusValue; label: string; cls: string }[] = [
  { value: "new",       label: "New",        cls: "bg-blue-100 text-blue-700" },
  { value: "active",    label: "Active",     cls: "bg-emerald-100 text-emerald-700" },
  { value: "follow_up", label: "Follow Up",  cls: "bg-amber-100 text-amber-700" },
  { value: "completed", label: "Completed",  cls: "bg-violet-100 text-violet-700" },
  { value: "lost",      label: "Lost",       cls: "bg-rose-100 text-rose-700" },
];

function StatusCell({ clientId, initial }: { clientId: number; initial: ClientStatusValue }) {
  const [status, setStatus] = useState<ClientStatusValue>(initial);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function pick(v: ClientStatusValue) {
    setSaving(true);
    setOpen(false);
    try {
      await updateClientStatus(clientId, v);
      setStatus(v);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-opacity ${cur.cls} ${saving ? "opacity-50" : "hover:opacity-80"}`}
      >
        {saving ? "…" : cur.label}
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 min-w-[110px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => pick(s.value)}
              className={`w-full px-3 py-1.5 text-left text-xs font-semibold transition-colors hover:bg-zinc-50 ${s.value === status ? "opacity-60" : ""}`}
            >
              <span className={`mr-1.5 inline-block rounded-full px-1.5 py-0.5 ${s.cls}`}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Service = {
  id: number;
  description: string | null;
  serviceType: { name: string; isRecurring: boolean };
  durationYears: number | null;
  soldByName: string | null;
  upsellerName: string | null;
  saleDate: Date;
  totalAmount: unknown;
  endDate: Date | null;
  payments: { amount: unknown }[];
};

type Client = {
  id: number;
  name: string;
  phone: string | null;
  pmName: string | null;
  status: ClientStatusValue | null;
  brand: { id: number; name: string } | null;
  projectManager: { name: string } | null;
  services: Service[];
};

function brandColor(_name: string) {
  return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
}

function serviceColor(_name: string) {
  return "bg-zinc-100 text-zinc-600";
}


function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
function renewalBadge(days: number) {
  if (days < 0) return "bg-zinc-900 text-white";
  if (days <= 30) return "bg-zinc-200 text-zinc-700";
  return "bg-zinc-200 text-zinc-600";
}
function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClientsTable({
  initial,
  total,
  filtersJson,
  frontSellerNames,
  upsellerNames,
  isAdmin,
  trashAction,
}: {
  initial: Client[];
  total: number;
  filtersJson: string;
  frontSellerNames: string[];
  upsellerNames: string[];
  isAdmin: boolean;
  trashAction: (id: number, formData: FormData) => Promise<void>;
}) {
  const [clients, setClients] = useState<Client[]>(initial);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initial.length < total);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fsNames = new Set(frontSellerNames);
  const usNames = new Set(upsellerNames);

  useEffect(() => {
    startTransition(() => {
      setClients(initial);
      setPage(1);
      setHasMore(initial.length < total);
    });
  }, [initial, total]);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isPending) {
          startTransition(async () => {
            const nextPage = page + 1;
            const more = await loadMoreClients(JSON.parse(filtersJson), nextPage);
            if (more.length === 0) { setHasMore(false); return; }
            setClients((prev) => [...prev, ...more] as Client[]);
            setPage(nextPage);
            if (clients.length + more.length >= total) setHasMore(false);
          });
        }
      },
      { threshold: 0.1 }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, isPending, page, filtersJson, clients.length, total]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-500 bg-zinc-50">
            <th className="px-3 py-1.5 border-r border-zinc-200">Status</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Date</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Name</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Phone</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Brand</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Services</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Description</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Paid</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Remaining</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Due Date</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Front Seller</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Upseller</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">PM</th>
            <th className="px-3 py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 && (
            <tr><td colSpan={13} className="px-4 py-6 text-center text-zinc-400">No clients found</td></tr>
          )}
          {clients.map((c) => {
            const rows = c.services.length > 0 ? c.services : [null];

            return rows.map((svc, si) => {
              const paid = svc ? svc.payments.reduce((ps, p) => ps + Number(p.amount), 0) : 0;
              const total2 = svc ? Number(svc.totalAmount) : 0;
              const rem = total2 - paid;
              const isFirst = si === 0;
              const rowSpan = rows.length;
              const borderTop = si > 0 ? "border-t border-dashed border-zinc-100" : "";

              return (
                <tr key={`${c.id}-${si}`} className={`hover:bg-zinc-50/70 ${isFirst ? "border-t border-zinc-200" : ""}`}>
                  {/* Client-level cells — only on first service row, using rowSpan */}
                  {isFirst && (
                    <td rowSpan={rowSpan} className="px-3 py-1 border-r border-zinc-100 align-top pt-2">
                      <StatusCell clientId={c.id} initial={(c.status as ClientStatusValue) ?? "new"} />
                    </td>
                  )}

                  {/* Service-level: date */}
                  <td className={`px-3 py-1 border-r border-zinc-100 text-zinc-500 whitespace-nowrap text-xs ${borderTop}`}>
                    {svc ? formatDate(svc.saleDate) : "—"}
                  </td>

                  {/* Client name — only first row */}
                  {isFirst && (
                    <td rowSpan={rowSpan} className="px-3 py-1 border-r border-zinc-100 align-top pt-2">
                      <Link href={`/clients/${c.id}`} className="font-medium text-zinc-900 hover:underline">{c.name}</Link>
                    </td>
                  )}

                  {/* Phone — only first row */}
                  {isFirst && (
                    <td rowSpan={rowSpan} className="px-3 py-1 border-r border-zinc-100 text-zinc-500 text-xs align-top pt-2">{c.phone ?? "—"}</td>
                  )}

                  {/* Brand — only first row */}
                  {isFirst && (
                    <td rowSpan={rowSpan} className="px-3 py-1 border-r border-zinc-100 align-top pt-2">
                      {c.brand ? (
                        <Link href={`/brands/${c.brand.id}`} className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold hover:opacity-80 ${brandColor(c.brand.name)}`}>{c.brand.name}</Link>
                      ) : <span className="text-zinc-300">—</span>}
                    </td>
                  )}

                  {/* Service name / description */}
                  <td className={`px-3 py-1 border-r border-zinc-100 text-xs ${borderTop}`}>
                    {svc ? (
                      svc.description ? (
                        <div className="flex flex-wrap gap-0.5">
                          {svc.description
                            .split(/\s*\+\s*/)
                            .map((part) => part.replace(/\s*\(.*?\)\s*/g, "").trim())
                            .filter(Boolean)
                            .map((part, i) => (
                              <span key={i} className="rounded-full bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600">
                                {part}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600">
                          {svc.serviceType.isRecurring && svc.durationYears
                            ? `${svc.serviceType.name} (${svc.durationYears}yr)`
                            : svc.serviceType.name}
                        </span>
                      )
                    ) : <span className="text-zinc-300">—</span>}
                  </td>

                  {/* Description */}
                  <td className={`px-3 py-1 border-r border-zinc-100 text-zinc-500 text-xs max-w-[200px] ${borderTop}`}>
                    {svc?.description ? <span className="line-clamp-2">{svc.description}</span> : <span className="text-zinc-300">—</span>}
                  </td>

                  {/* Paid */}
                  <td className={`px-3 py-1 border-r border-zinc-100 text-zinc-600 whitespace-nowrap text-xs ${borderTop}`}>
                    {paid > 0 ? `£${paid.toFixed(2)}` : "—"}
                  </td>

                  {/* Remaining */}
                  <td className={`px-3 py-1 border-r border-zinc-100 whitespace-nowrap text-xs ${borderTop}`}>
                    {rem > 0 ? <span className="text-zinc-900 font-medium">£{rem.toFixed(2)}</span> : <span className="text-zinc-400">£0.00</span>}
                  </td>

                  {/* Due Date */}
                  <td className={`px-3 py-1 border-r border-zinc-100 whitespace-nowrap text-xs ${borderTop}`}>
                    {svc?.endDate ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${renewalBadge(daysUntil(svc.endDate))}`}>{formatDate(svc.endDate)}</span>
                    ) : "—"}
                  </td>


                  {/* Front Seller */}
                  <td className={`px-3 py-1 border-r border-zinc-100 text-zinc-600 text-xs ${borderTop}`}>
                    {svc?.soldByName && fsNames.has(svc.soldByName) && !svc.upsellerName ? svc.soldByName : "—"}
                  </td>

                  {/* Upseller */}
                  <td className={`px-3 py-1 border-r border-zinc-100 text-zinc-600 text-xs ${borderTop}`}>
                    {svc?.upsellerName ?? (svc?.soldByName && usNames.has(svc.soldByName) ? svc.soldByName : "—")}
                  </td>

                  {/* PM — only first row */}
                  {isFirst && (
                    <td rowSpan={rowSpan} className="px-3 py-1 border-r border-zinc-100 text-zinc-600 text-xs align-top pt-2">
                      {c.projectManager?.name ?? c.pmName ?? "—"}
                    </td>
                  )}

                  {/* Trash — only first row */}
                  {isFirst && (
                    <td rowSpan={rowSpan} className="px-3 py-1 text-right align-top pt-2">
                      {isAdmin && (
                        <form action={trashAction.bind(null, c.id)}>
                          <button type="submit" className="text-zinc-300 hover:text-red-500 transition-colors"><FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" /></button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              );
            });
          })}
        </tbody>
      </table>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-2 text-center text-xs text-zinc-400">
        {isPending && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />}
        {!isPending && !hasMore && clients.length > 0 && <span>{clients.length} of {total} clients</span>}
      </div>
    </div>
  );
}
