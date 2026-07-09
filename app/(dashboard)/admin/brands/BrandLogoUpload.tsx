"use client";

import { useRef, useState, useTransition } from "react";

export default function BrandLogoUpload({
  brandId,
  initialLogo,
}: {
  brandId: number;
  initialLogo: string | null;
}) {
  const [logo, setLogo] = useState(initialLogo);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const fd = new FormData();
    fd.append("logo", file);
    startTransition(async () => {
      const res = await fetch(`/api/admin/brands/${brandId}/logo`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.logoUrl) setLogo(data.logoUrl + "?t=" + Date.now());
    });
  }

  function removeLogo() {
    startTransition(async () => {
      await fetch(`/api/admin/brands/${brandId}/logo`, { method: "DELETE" });
      setLogo(null);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {logo ? (
        <div className="relative group h-8 w-8 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt="logo"
            className="h-full w-full rounded object-contain border border-zinc-200 bg-white p-0.5"
          />
          <button
            onClick={removeLogo}
            disabled={isPending}
            title="Remove logo"
            className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] leading-none"
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded border border-dashed border-zinc-300 bg-zinc-50 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
          title="Upload logo"
        >
          {isPending ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          ) : (
            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
