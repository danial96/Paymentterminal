"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { loadMoreClients } from "@/app/actions/clients";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

type Service = {
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

const UPSELL_CHAIN = [
  { key:"hosting",  label:"Hosting",      color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
  { key:"domain",   label:"Domain",       color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
  { key:"seo",      label:"SEO",          color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
  { key:"security", label:"Security",     color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
  { key:"email",    label:"Email",        color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
  { key:"gmb",      label:"GMB",          color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
  { key:"social",   label:"Social Media", color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
  { key:"logo",     label:"Logo",         color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
  { key:"branding", label:"Branding",     color:"bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200" },
];
function getUpsellOpportunities(serviceNames: string[]) {
  const lower = serviceNames.map((n) => n.toLowerCase());
  const hasKey = (k: string) => lower.some((n) => n.includes(k));
  if (!hasKey("website")) return [];
  return UPSELL_CHAIN.filter((u) => !hasKey(u.key));
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
            <th className="px-3 py-1.5 border-r border-zinc-200">Date</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Name</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Phone</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Brand</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Services</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Paid</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Remaining</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Due Date</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Upsell Opportunities</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Front Seller</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">Upseller</th>
            <th className="px-3 py-1.5 border-r border-zinc-200">PM</th>
            {isAdmin && <th className="px-3 py-1.5"></th>}
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 && (
            <tr><td colSpan={isAdmin ? 13 : 12} className="px-4 py-6 text-center text-zinc-400">No clients found</td></tr>
          )}
          {clients.map((c) => {
            const paid = c.services.reduce((s, sv) => s + sv.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0);
            const total2 = c.services.reduce((s, sv) => s + Number(sv.totalAmount), 0);
            const rem = total2 - paid;
            const endDates = c.services.map((s) => s.endDate).filter(Boolean) as Date[];
            const dueDate = endDates.length > 0 ? endDates.reduce((a, b) => (new Date(a) < new Date(b) ? a : b)) : null;
            const frontSeller = c.services.find((s) => !s.upsellerName && s.soldByName && fsNames.has(s.soldByName))?.soldByName;
            const upsellers = Array.from(new Set(c.services.flatMap((s) => [s.upsellerName, s.soldByName && s.upsellerName ? s.soldByName : null]).filter((n): n is string => !!n && usNames.has(n))));
            const upsellOps = getUpsellOpportunities(c.services.map((s) => s.serviceType.name));
            return (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="px-3 py-1 border-r border-zinc-100 text-zinc-500 whitespace-nowrap text-xs">{c.services[0] ? formatDate(c.services[0].saleDate) : "—"}</td>
                <td className="px-3 py-1 border-r border-zinc-100">
                  <Link href={`/clients/${c.id}`} className="font-medium text-zinc-900 hover:underline">{c.name}</Link>
                </td>
                <td className="px-3 py-1 border-r border-zinc-100 text-zinc-500 text-xs">{c.phone ?? "—"}</td>
                <td className="px-3 py-1 border-r border-zinc-100">
                  {c.brand ? (
                    <Link href={`/brands/${c.brand.id}`} className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold hover:opacity-80 ${brandColor(c.brand.name)}`}>{c.brand.name}</Link>
                  ) : <span className="text-zinc-300">—</span>}
                </td>
                <td className="px-3 py-1 border-r border-zinc-100">
                  {c.services.length === 0 ? <span className="text-zinc-300">—</span> : (
                    <div className="flex flex-wrap gap-0.5">
                      {c.services.map((s, i) => {
                        const label = s.serviceType.isRecurring && s.durationYears ? `${s.serviceType.name} (${s.durationYears}yr)` : s.serviceType.name;
                        return <span key={i} className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${serviceColor(s.serviceType.name)}`}>{label}</span>;
                      })}
                    </div>
                  )}
                </td>
                <td className="px-3 py-1 border-r border-zinc-100 text-zinc-600 whitespace-nowrap text-xs">{paid > 0 ? `£${paid.toFixed(2)}` : "—"}</td>
                <td className="px-3 py-1 border-r border-zinc-100 whitespace-nowrap text-xs">
                  {rem > 0 ? <span className="text-zinc-900 font-medium">£{rem.toFixed(2)}</span> : <span className="text-zinc-400">£0.00</span>}
                </td>
                <td className="px-3 py-1 border-r border-zinc-100 whitespace-nowrap text-xs">
                  {dueDate ? <span className={`rounded-full px-2 py-0.5 text-xs ${renewalBadge(daysUntil(dueDate))}`}>{formatDate(dueDate)}</span> : "—"}
                </td>
                <td className="px-3 py-1 border-r border-zinc-100">
                  {upsellOps.length === 0 ? <span className="text-zinc-300 text-xs">—</span> : (
                    <div className="flex flex-wrap gap-0.5">
                      {upsellOps.map((u) => <span key={u.key} className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${u.color}`}>{u.label}</span>)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-1 border-r border-zinc-100 text-zinc-600 text-xs">{frontSeller ?? "—"}</td>
                <td className="px-3 py-1 border-r border-zinc-100 text-zinc-600 text-xs">{upsellers.length > 0 ? upsellers.join(", ") : "—"}</td>
                <td className="px-3 py-1 border-r border-zinc-100 text-zinc-600 text-xs">{c.projectManager?.name ?? c.pmName ?? "—"}</td>
                {isAdmin && (
                  <td className="px-3 py-1 text-right">
                    <form action={trashAction.bind(null, c.id)}>
                      <button type="submit" className="text-zinc-300 hover:text-red-500 transition-colors"><FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" /></button>
                    </form>
                  </td>
                )}
              </tr>
            );
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
