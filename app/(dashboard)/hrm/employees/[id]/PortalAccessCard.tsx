"use client";

import { useState } from "react";
import { enablePortalAccess, disablePortalAccess } from "@/app/actions/hrm-registration";

export default function PortalAccessCard({
  employeeId,
  portalEnabled,
  portalEmail,
}: {
  employeeId: number;
  portalEnabled: boolean;
  portalEmail?: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleEnable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("portalEmail") as HTMLInputElement).value;
    const password = (form.elements.namedItem("portalPassword") as HTMLInputElement).value;
    const result = await enablePortalAccess(employeeId, email, password);
    if ("error" in result) {
      setMessage(result.error);
    } else {
      setMessage("Portal access enabled.");
      setShowForm(false);
    }
    setLoading(false);
  }

  async function handleDisable() {
    if (!confirm("Disable portal access for this employee?")) return;
    setLoading(true);
    try {
      await disablePortalAccess(employeeId);
      setMessage("Portal access disabled.");
    } catch (err: any) {
      setMessage(err?.message ?? "Error disabling portal access.");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
        Portal Access
      </h2>

      {message && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      {portalEnabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-zinc-700">Portal access is enabled</span>
          </div>
          {portalEmail && (
            <p className="text-xs text-zinc-500">Login email: <span className="font-medium text-zinc-700">{portalEmail}</span></p>
          )}
          <button
            onClick={handleDisable}
            disabled={loading}
            className="rounded-md border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Disable Portal Access
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-zinc-300" />
            <span className="text-sm text-zinc-500">Portal access is not enabled</span>
          </div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md px-4 py-1.5 text-xs font-medium text-white"
              style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
            >
              Enable Portal Access
            </button>
          ) : (
            <form onSubmit={handleEnable} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Portal Email *</label>
                <input
                  name="portalEmail"
                  type="email"
                  required
                  defaultValue={portalEmail ?? ""}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Portal Password *</label>
                <input
                  name="portalPassword"
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
