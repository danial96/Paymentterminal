"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  action: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterForm({ action, children, className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    fd.forEach((val, key) => { if (val) params.set(key, String(val)); });
    startTransition(() => {
      router.push(`${action}?${params.toString()}`);
    });
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className={className} data-pending={pending ? "true" : undefined}>
      {children}
      {pending && (
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 ml-1">
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading...
        </span>
      )}
    </form>
  );
}
