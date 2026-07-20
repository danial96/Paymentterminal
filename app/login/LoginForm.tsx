"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-500/20 border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-white/70">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-white/70">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
        style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
