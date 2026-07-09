"use client";

import { useState } from "react";

export default function BrandDetailsEditor({
  brandId,
  initialAddress,
  initialPhone,
  initialEmail,
  initialWebsite,
  initialBrandColor,
}: {
  brandId: number;
  initialAddress: string;
  initialPhone: string;
  initialEmail: string;
  initialWebsite: string;
  initialBrandColor: string;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [website, setWebsite] = useState(initialWebsite);
  const [brandColor, setBrandColor] = useState(initialBrandColor || "#1a1a2e");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      const fd = new FormData();
      fd.append("address", address);
      fd.append("phone", phone);
      fd.append("email", email);
      fd.append("website", website);
      fd.append("brandColor", brandColor);
      const res = await fetch(`/api/admin/brands/${brandId}/details`, { method: "POST", body: fd });
      if (res.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed to save");
        setStatus("error");
      }
    } catch {
      setStatus("error");
      alert("Network error — please try again");
    }
  }

  return (
    <div className="px-4 pb-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
        Company Details
        <span className="ml-2 font-normal normal-case tracking-normal text-zinc-400">(shown on invoices)</span>
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-xs font-medium text-zinc-500">Invoice Accent Colour</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              className="h-9 w-16 rounded border border-zinc-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              placeholder="#1a1a2e"
              className="w-28 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors font-mono"
            />
            <span className="text-xs text-zinc-400">Used in invoice header, table & totals</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Phone</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+44 7700 900000"
            className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="info@brand.com"
            className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Website</label>
          <input
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://brand.com"
            className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Address</label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={2}
            placeholder="21 High Street, London, UK"
            className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors resize-none"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {status === "saving" ? "Saving..." : "Save Details"}
        </button>
        {status === "saved" && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Saved successfully
          </span>
        )}
        {status === "error" && (
          <span className="text-sm text-red-500">Failed to save — try again</span>
        )}
      </div>

      {/* Current saved preview */}
      {(initialPhone || initialEmail || initialAddress || initialWebsite) && status === "idle" && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
          <span className="font-semibold">✓ Saved: </span>
          {[initialPhone, initialEmail, initialAddress].filter(Boolean).join(" · ")}
        </div>
      )}
    </div>
  );
}
