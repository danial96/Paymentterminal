"use client";
import { useState } from "react";
import { generateRegistrationLink } from "@/app/actions/hrm-registration";

export default function GenerateLinkButton() {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const token = await generateRegistrationLink();
    const url = `${window.location.origin}/join/${token}`;
    setLink(url);
    setLoading(false);
  }

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Registration Link"}
      </button>

      {link && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Registration Link Ready</h2>
            <p className="text-xs text-zinc-500 mb-4">Share this link with the employee. Expires in 7 days. One-time use only.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={link}
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-700 bg-zinc-50 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="rounded-lg px-3 py-2 text-xs font-medium text-white"
                style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setLink(null)}
              className="mt-4 w-full rounded-lg border border-zinc-200 py-2 text-sm text-zinc-500 hover:bg-zinc-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
