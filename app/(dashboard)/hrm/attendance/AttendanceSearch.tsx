"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function AttendanceSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val) params.set("q", val);
      else params.delete("q");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  let timer: ReturnType<typeof setTimeout>;
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timer);
    const val = e.target.value;
    timer = setTimeout(() => update(val), 350);
  }

  return (
    <div className="relative">
      <input
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Search employee name or ID…"
        className={`rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 w-56 transition-opacity ${isPending ? "opacity-60" : ""}`}
      />
      {isPending && (
        <span className="absolute right-2 top-2.5 text-zinc-400">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </span>
      )}
    </div>
  );
}
