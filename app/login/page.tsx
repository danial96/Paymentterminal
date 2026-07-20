import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0d1020 0%, #1a0d35 50%, #0d1020 100%)" }}>
      <div className="w-full max-w-sm rounded-2xl p-8 shadow-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ikia-logo.png" alt="IKIA TECH" style={{ height: "70px", objectFit: "contain" }} />
        </div>
        <p className="mb-6 text-sm text-white/60 text-center">Sign in to your account</p>
        <LoginForm />
      </div>
    </div>
  );
}
