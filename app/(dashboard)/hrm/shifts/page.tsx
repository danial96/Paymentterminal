import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { deleteShift } from "@/app/actions/hrm-shifts";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";
import { ShiftFormClient } from "@/app/(dashboard)/hrm/components/ShiftFormClient";

export default async function ShiftsPage() {
  await requireUser();
  const shifts = await prisma.hRMShift.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Shift Management</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Add Shift</h2>
          <ShiftFormClient />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">All Shifts ({shifts.length})</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {shifts.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-400">No shifts defined yet</p>}
            {shifts.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{s.isActive ? "Active" : "Inactive"}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-600">
                      {s.shiftType === "CUSTOM" && s.customLabel ? `Custom — ${s.customLabel}` : s.shiftType}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{s.startTime} – {s.endTime} · {s.breakMinutes}min break</p>
                  <p className="text-xs text-zinc-400">{Array.isArray(s.workingDays) ? (s.workingDays as string[]).join(", ") : ""} · {s._count.employees} employee{s._count.employees !== 1 ? "s" : ""}</p>
                </div>
                <form action={deleteShift.bind(null, s.id)}>
                  <DeleteButton className="text-xs text-red-500 hover:text-red-700 px-2" message="Delete this shift?" />
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
