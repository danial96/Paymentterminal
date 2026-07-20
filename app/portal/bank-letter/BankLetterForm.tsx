"use client";

import { useState, useTransition } from "react";
import { submitBankLetterRequest } from "@/app/actions/hrm-bank-letter";
import { useRouter } from "next/navigation";

export function BankLetterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await submitBankLetterRequest(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
          Additional Notes <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
          placeholder="e.g. preferred bank, branch, or any other info for HR..."
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
      >
        {isPending ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
