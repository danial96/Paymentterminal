"use client";

import { useState } from "react";
import { updateProfile, updatePassword } from "@/app/actions/account";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const result = await updateProfile(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) setStatus({ type: "error", msg: result.error });
    else setStatus({ type: "success", msg: "Profile updated successfully" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status && (
        <p className={`rounded-lg px-3 py-2 text-sm ${status.type === "success" ? "bg-zinc-100 text-zinc-700" : "bg-red-50 text-red-600"}`}>
          {status.msg}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={name}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
        <input
          name="email"
          type="email"
          required
          defaultValue={email}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-brand rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const result = await updatePassword(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) setStatus({ type: "error", msg: result.error });
    else {
      setStatus({ type: "success", msg: "Password updated successfully" });
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status && (
        <p className={`rounded-lg px-3 py-2 text-sm ${status.type === "success" ? "bg-zinc-100 text-zinc-700" : "bg-red-50 text-red-600"}`}>
          {status.msg}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Current Password</label>
        <input
          name="currentPassword"
          type="password"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">New Password</label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm New Password</label>
        <input
          name="confirmPassword"
          type="password"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-brand rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
