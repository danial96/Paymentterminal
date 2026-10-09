"use client";

import { useTransition } from "react";
import { updateInvoiceStatus } from "@/app/actions/invoices";
import { useRouter } from "next/navigation";

export default function InvoiceStatusButton({
  id,
  status,
}: {
  id: number;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function update(newStatus: "draft" | "sent" | "paid" | "cancelled") {
    startTransition(async () => {
      await updateInvoiceStatus(id, newStatus);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {status !== "paid" && (
        <button
          onClick={() => update("paid")}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Paid
        </button>
      )}
      {status !== "sent" && status !== "paid" && (
        <button
          onClick={() => update("sent")}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      )}
      {status === "sent" && (
        <button
          onClick={() => update("draft")}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          Unsend
        </button>
      )}
      {status === "paid" && (
        <button
          onClick={() => update("draft")}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
        >
          Unpaid
        </button>
      )}
    </div>
  );
}
