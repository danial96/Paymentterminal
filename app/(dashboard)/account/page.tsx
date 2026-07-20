import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { ProfileForm, PasswordForm } from "./AccountForms";

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: Number(sessionUser.id) },
    select: { name: true, email: true, role: true, createdAt: true },
  });
  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Account Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your profile and password</p>
      </div>

      {/* Profile info card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white uppercase shrink-0"
            style={{ background: "linear-gradient(135deg, #29c0d5, #503d98)" }}
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-900">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 capitalize">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Profile Information</h2>
        <ProfileForm name={user.name} email={user.email} />
      </div>

      {/* Password card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-1">Change Password</h2>
        <p className="text-xs text-zinc-400 mb-4">Must be at least 8 characters</p>
        <PasswordForm />
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Account Info</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Member since</dt>
            <dd className="text-zinc-900 font-medium">{user.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Role</dt>
            <dd className="text-zinc-900 font-medium capitalize">{user.role.replace("_", " ")}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
