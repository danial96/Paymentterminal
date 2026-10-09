"use client";
import { useTransition } from "react";
import { markServiceRenewed } from "@/app/actions/renewService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";

export default function MarkRenewedButton({ serviceId }: { serviceId: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      title="Mark as Renewed — removes from this list"
      disabled={pending}
      onClick={() => {
        if (confirm("Mark this service as renewed? It will be removed from the renewals list.")) {
          start(() => markServiceRenewed(serviceId));
        }
      }}
      className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-100 transition disabled:opacity-50"
    >
      <FontAwesomeIcon icon={faRotate} className={`h-3 w-3 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Saving..." : "Renewed"}
    </button>
  );
}
