"use client";
import { useTransition } from "react";
import { updateClientStatus, ClientStatusValue } from "@/app/actions/clientStatus";

const OPTIONS: { value: ClientStatusValue; label: string; color: string }[] = [
  { value: "new",       label: "New",       color: "text-blue-600" },
  { value: "active",    label: "Active",    color: "text-emerald-600" },
  { value: "follow_up", label: "Follow Up", color: "text-amber-600" },
  { value: "completed", label: "Completed", color: "text-violet-600" },
  { value: "lost",      label: "Closed",    color: "text-zinc-400" },
];

export default function ClientStatusSelect({
  clientId,
  current,
}: {
  clientId: number;
  current: ClientStatusValue;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as ClientStatusValue;
    startTransition(() => updateClientStatus(clientId, val));
  }

  const opt = OPTIONS.find(o => o.value === current);

  return (
    <select
      value={current}
      onChange={onChange}
      disabled={pending}
      className={`rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-100 cursor-pointer disabled:opacity-50 ${opt?.color ?? "text-zinc-600"}`}
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
