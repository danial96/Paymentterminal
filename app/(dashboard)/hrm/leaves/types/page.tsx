import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createLeaveType, deleteLeaveType } from "@/app/actions/hrm-leaves";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";
import { SubmitButton } from "@/app/components/SubmitButton";
import Link from "next/link";

export default async function LeaveTypesPage() {
  await requireUser();
  const leaveTypes = await prisma.hRMLeaveType.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { leaves: true } } } });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/hrm/leaves" className="text-zinc-400 hover:text-zinc-600 text-sm">← Leaves</Link>
        <h1 className="text-xl font-bold text-zinc-900">Leave Types</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Add Leave Type</h2>
          <form action={createLeaveType} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Name *</label>
                <input name="name" required placeholder="e.g. Annual Leave" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Code *</label>
                <input name="code" required placeholder="e.g. AL, CL, SL" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Days Allowed per Year</label>
              <input name="daysAllowed" type="number" defaultValue="0" min="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                <input name="isPaid" type="checkbox" defaultChecked value="true" className="rounded" />
                Paid Leave
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                <input name="carryForward" type="checkbox" value="true" className="rounded" />
                Carry Forward
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
              <textarea name="description" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <SubmitButton className="btn-brand w-full rounded-lg py-2 text-sm font-medium text-white" pendingText="Adding...">Add Leave Type</SubmitButton>
          </form>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">All Leave Types</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {leaveTypes.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">No leave types defined. Add common types like Annual, Casual, Sick, Emergency.</p>
            )}
            {leaveTypes.map((lt) => (
              <div key={lt.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900">{lt.name}</p>
                    <span className="rounded font-mono px-1.5 py-0.5 text-[10px] bg-zinc-100 text-zinc-500">{lt.code}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${lt.isPaid ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}>{lt.isPaid ? "Paid" : "Unpaid"}</span>
                    {lt.carryForward && <span className="rounded-full px-2 py-0.5 text-[10px] bg-zinc-200 text-zinc-700">Carry Forward</span>}
                  </div>
                  <p className="text-xs text-zinc-400">{lt.daysAllowed} days/year · {lt._count.leaves} total leaves taken</p>
                </div>
                <form action={deleteLeaveType.bind(null, lt.id)}>
                  <DeleteButton className="text-xs text-red-500 hover:text-red-700 px-2" message="Delete this leave type?" />
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
