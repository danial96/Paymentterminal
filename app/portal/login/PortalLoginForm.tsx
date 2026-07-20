"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PortalLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await signIn("employee-portal", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/portal/dashboard");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 p-8 space-y-5"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#29c0d5]/50"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#29c0d5]/50"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
