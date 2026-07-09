"use client";

import { formatDate } from "@/lib/format";

export default function TrashRow({
  title,
  subtitle,
  deletedAt,
  restoreAction,
  deleteAction,
  deleteLabel,
}: {
  title: string;
  subtitle?: string;
  deletedAt: Date;
  restoreAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
  deleteLabel: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div>
        <p className="font-medium text-zinc-900">{title}</p>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        <p className="text-xs text-zinc-300 mt-0.5">
          Deleted {formatDate(deletedAt)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <form action={restoreAction}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            ↩ Restore
          </button>
        </form>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm(deleteLabel + "\n\nThis cannot be undone.")) e.preventDefault();
          }}
        >
          <button
            type="submit"
            className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
          >
            Delete Forever
          </button>
        </form>
      </div>
    </div>
  );
}
