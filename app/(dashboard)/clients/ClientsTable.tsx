"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { loadMoreClients } from "@/app/actions/clients";

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

const BRAND_COLORS: Record<string, string> = {
  "digi design lab":      "bg-teal-100 text-teal-800 ring-1 ring-teal-300",
  "alpha web creators":   "bg-lime-100 text-lime-800 ring-1 ring-lime-300",
  "elite design hub":     "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
  "creative web codes":   "bg-pink-100 text-pink-800 ring-1 ring-pink-300",
  "stellar web design":   "bg-sky-100 text-sky-800 ring-1 ring-sky-300",
  "stellar web designs":  "bg-sky-100 text-sky-800 ring-1 ring-sky-300",
  "omni web creators":    "bg-purple-100 text-purple-800 ring-1 ring-purple-300",
  "olenix web solutions": "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300",
  "imagine web studio":   "bg-violet-100 text-violet-800 ring-1 ring-violet-300",
  "craft vision digital": "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300",
  "craft tide":           "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300",
  "web vision studios":   "bg-orange-100 text-orange-800 ring-1 ring-orange-300",
  "design vertex":        "bg-violet-100 text-violet-800 ring-1 ring-violet-300",
};
function brandColor(name: string) {
  const key = name.toLowerCase();
  if (BRAND_COLORS[key]) return BRAND_COLORS[key];
  for (const [k, v] of Object.entries(BRAND_COLORS)) if (key.includes(k) || k.includes(key)) return v;
  const f = ["bg-blue-100 text-blue-800","bg-emerald-100 text-emerald-800","bg-violet-100 text-violet-800","bg-amber-100 text-amber-800","bg-pink-100 text-pink-800","bg-orange-100 text-orange-800","bg-cyan-100 text-cyan-800","bg-teal-100 text-teal-800"];
  return f[name.charCodeAt(0) % f.length];
}

const SERVICE_COLORS: Record<string, string> = {
  website:"bg-blue-50 text-blue-700", hosting:"bg-emerald-50 text-emerald-700",
  domain:"bg-violet-50 text-violet-700", seo:"bg-amber-50 text-amber-700",
  graphic:"bg-pink-50 text-pink-700", cv:"bg-orange-50 text-orange-700",
  email:"bg-cyan-50 text-cyan-700", security:"bg-red-50 text-red-700",
  gmb:"bg-teal-50 text-teal-700", social:"bg-fuchsia-50 text-fuchsia-700",
};
function serviceColor(name: string) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(SERVICE_COLORS)) if (key.includes(k)) return v;
  const f = ["bg-blue-50 text-blue-700","bg-emerald-50 text-emerald-700","bg-violet-50 text-violet-700","bg-amber-50 text-amber-700","bg-pink-50 text-pink-700","bg-orange-50 text-orange-700","bg-cyan-50 text-cyan-700","bg-teal-50 text-teal-700"];
  return f[name.charCodeAt(0) % f.length];
}

const UPSELL_CHAIN = [
  { key:"hosting",  label:"Hosting",      color:"bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  { key:"domain",   label:"Domain",       color:"bg-violet-50 text-violet-700 ring-1 ring-violet-200" },
  { key:"seo",      label:"SEO",          color:"bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  { key:"security", label:"Security",     color:"bg-red-50 text-red-700 ring-1 ring-red-200" },
  { key:"email",    label:"Email",        color:"bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200" },
  { key:"gmb",      label:"GMB",          color:"bg-teal-50 text-teal-700 ring-1 ring-teal-200" },
  { key:"social",   label:"Social Media", color:"bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200" },
  { key:"logo",     label:"Logo",         color:"bg-pink-50 text-pink-700 ring-1 ring-pink-200" },
  { key:"branding", label:"Branding",     color:"bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
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
  if (days < 0) return "bg-red-100 text-red-700";
  if (days <= 30) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
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
                  {rem > 0 ? <span className="text-red-600 font-medium">£{rem.toFixed(2)}</span> : <span className="text-zinc-400">£0.00</span>}
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
                      <button type="submit" className="text-zinc-300 hover:text-red-500 transition-colors">🗑</button>
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
