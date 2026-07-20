"use client";

import { useState, useTransition } from "react";
import { updateServiceType, deleteServiceType } from "@/app/actions/admin";

type ServiceType = {
  id: number;
  name: string;
  isRecurring: boolean;
};

export default function ServiceTypeList({ serviceTypes }: { serviceTypes: ServiceType[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRecurring, setEditRecurring] = useState(false);
  const [pending, startTransition] = useTransition();

  function startEdit(st: ServiceType) {
    setEditingId(st.id);
    setEditName(st.name);
    setEditRecurring(st.isRecurring);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(id: number) {
    const fd = new FormData();
    fd.set("name", editName);
    if (editRecurring) fd.set("isRecurring", "on");
    startTransition(async () => {
      await updateServiceType(id, fd);
      setEditingId(null);
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(() => deleteServiceType(id));
  }

  return (
    <div className="max-w-2xl rounded-lg border border-zinc-200 bg-white">
      <ul className="divide-y divide-zinc-100">
        {serviceTypes.map((st) =>
          editingId === st.id ? (
            <li key={st.id} className="flex items-center gap-2 px-4 py-2">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <label className="flex items-center gap-1 text-xs text-zinc-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={editRecurring}
                  onChange={(e) => setEditRecurring(e.target.checked)}
                />
                Recurring
              </label>
              <button
                onClick={() => saveEdit(st.id)}
                disabled={pending || !editName.trim()}
                className="btn-brand rounded-md px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                className="text-xs text-zinc-400 hover:text-zinc-700"
              >
                Cancel
              </button>
            </li>
          ) : (
            <li key={st.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
              <span className="flex-1">
                {st.name}
                {st.isRecurring && (
                  <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                    recurring
                  </span>
                )}
              </span>
              <button
                onClick={() => startEdit(st)}
                className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(st.id, st.name)}
                disabled={pending}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
