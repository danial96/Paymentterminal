import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">Softcube CRM</h1>
        <p className="mb-6 text-sm text-zinc-500">Sign in to your account</p>
        <LoginForm />
      </div>
    </div>
  );
}
