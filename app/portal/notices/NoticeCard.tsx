"use client";

import { useState } from "react";

export function NoticeCard({
  title,
  content,
  publishedAt,
  isNew,
}: {
  title: string;
  content: string | null;
  publishedAt: Date | null;
  isNew: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border bg-white transition-shadow hover:shadow-sm ${isNew ? "border-[#29c0d5]/40" : "border-zinc-200"}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isNew && (
              <span className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#29c0d5" }} />
            )}
            <p className="text-sm font-semibold text-zinc-900 leading-snug">{title}</p>
          </div>
          {publishedAt && (
            <p className="text-[11px] text-zinc-400">
              {new Date(publishedAt).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {/* Preview line when collapsed */}
          {!expanded && content && (
            <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1">{content}</p>
          )}
        </div>
        <span className="shrink-0 mt-0.5 text-zinc-400">
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {expanded && content && (
        <div className="px-5 pb-5">
          <div className="h-px bg-zinc-100 mb-4" />
          <p className="text-sm text-zinc-700 whitespace-pre-line leading-relaxed">{content}</p>
        </div>
      )}

      {expanded && !content && (
        <div className="px-5 pb-4">
          <div className="h-px bg-zinc-100 mb-3" />
          <p className="text-sm text-zinc-400 italic">No content provided for this notice.</p>
        </div>
      )}
    </div>
  );
}
