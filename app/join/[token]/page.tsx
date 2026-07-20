import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RegisterForm from "./RegisterForm";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reg = await prisma.hRMRegistrationToken.findUnique({ where: { token } });

  if (!reg) notFound();

  const expired = reg.expiresAt < new Date();
  const used = !!reg.usedAt;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(135deg, #0d1020 0%, #1a0d35 50%, #0d1020 100%)" }}>
      <div className="w-full max-w-lg rounded-2xl p-8 shadow-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="IKIA TECH" style={{ height: "56px", objectFit: "contain" }} />
        </div>
        <h1 className="text-xl font-bold text-white text-center mb-1">Employee Registration</h1>
        <p className="text-sm text-white/50 text-center mb-6">Fill in your details to complete registration</p>

        {expired && (
          <div className="rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm text-white/70 text-center">
            This registration link has expired. Please contact HR for a new link.
          </div>
        )}
        {used && !expired && (
          <div className="rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm text-white/70 text-center">
            This link has already been used. Your registration is pending HR approval.
          </div>
        )}
        {!expired && !used && <RegisterForm token={token} />}
      </div>
    </div>
  );
}
