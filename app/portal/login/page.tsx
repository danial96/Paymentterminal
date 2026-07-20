import PortalLoginForm from "./PortalLoginForm";

export default function PortalLoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #141516 0%, #1e1f21 100%)" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="Logo" className="h-12 mx-auto mb-6 object-contain" />
          <h1 className="text-2xl font-bold text-white">Employee Portal</h1>
          <p className="text-sm text-white/50 mt-1">Sign in with your portal credentials</p>
        </div>
        <PortalLoginForm />
      </div>
    </div>
  );
}
