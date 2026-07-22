export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileRequestActions from "../employees/[id]/ProfileRequestActions";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED:  "bg-red-100 text-red-600 border-red-200",
  CANCELLED: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export default async function ProfileRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser();
  const { status = "PENDING" } = await searchParams;

  const requests = await (prisma as any).hRMProfileUpdateRequest.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    take: 100,
  });

  const pendingCount = await (prisma as any).hRMProfileUpdateRequest.count({ where: { status: "PENDING" } });

  const TABS = [
    { key: "PENDING",  label: "Pending",  count: pendingCount },
    { key: "APPROVED", label: "Approved", count: null },
    { key: "REJECTED", label: "Rejected", count: null },
    { key: "ALL",      label: "All",      count: null },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Profile Update Requests</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Employee-submitted requests to update their profile information</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 w-fit">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/hrm/profile-requests?status=${tab.key}`}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              status === tab.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="rounded-full bg-red-500 text-white px-1.5 py-0.5 text-[10px] font-bold leading-none">
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm text-zinc-400">No {status.toLowerCase()} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-start gap-4">
                {/* Employee info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Link href={`/hrm/employees/${r.employee.id}`} className="font-semibold text-zinc-900 hover:underline text-sm">
                      {r.employee.firstName} {r.employee.lastName}
                    </Link>
                    <span className="text-xs text-zinc-400">{r.employee.employeeId}</span>
                    <span className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[r.status] ?? STATUS_STYLES.CANCELLED}`}>
                      {r.status}
                    </span>
                  </div>

                  {r.status === "PENDING" ? (
                    <ProfileRequestActions
                      requestId={r.id}
                      employeeId={r.employee.id}
                      fieldLabel={r.fieldLabel}
                      currentValue={r.currentValue}
                      requestedValue={r.requestedValue}
                    />
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-zinc-700">{r.fieldLabel}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        <span className="text-zinc-400">Was:</span> {r.currentValue || "—"}
                        <span className="mx-2 text-zinc-300">→</span>
                        <span className="font-medium text-zinc-900">{r.requestedValue}</span>
                      </p>
                      {r.hrNote && <p className="text-[10px] text-zinc-400 mt-1">HR note: {r.hrNote}</p>}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-zinc-400">
                    {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
