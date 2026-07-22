"use client";

import { useTransition } from "react";
import { cancelProfileUpdateRequest } from "@/app/actions/hrm-profile-requests";

export default function CancelRequestButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => cancelProfileUpdateRequest(id))}
      className="text-[10px] text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors shrink-0"
    >
      {isPending ? "..." : "Cancel"}
    </button>
  );
}
