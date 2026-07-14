import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createHoliday, deleteHoliday } from "@/app/actions/hrm-holidays";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";

const TYPE_COLORS: Record<string, string> = {
  NATIONAL: "bg-red-100 text-red-600",
  COMPANY: "bg-blue-100 text-blue-600",
  BRANCH: "bg-purple-100 text-purple-600",
  OPTIONAL: "bg-zinc-100 text-zinc-500",
};

export default async function HolidaysPage() {
  await requireUser();
  const now = new Date();
  const holidays = await prisma.hRMHoliday.findMany({
    where: { date: { gte: new Date(now.getFullYear(), 0, 1) } },
    orderBy: { date: "asc" },
  });
  const upcoming = holidays.filter((h) => h.date >= now);
  const past = holidays.filter((h) => h.date < now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Holiday Calendar {now.getFullYear()}</h1>
        <span className="text-sm text-zinc-500">{upcoming.length} upcoming</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Add Holiday */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Add Holiday</h2>
          <form action={createHoliday} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Holiday Name *</label>
              <input name="name" required placeholder="e.g. Independence Day" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Date *</label>
                <input name="date" type="date" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Type</label>
                <select name="type" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="NATIONAL">National</option>
                  <option value="COMPANY">Company</option>
                  <option value="BRANCH">Branch</option>
                  <option value="OPTIONAL">Optional</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input name="isRecurring" type="checkbox" value="true" id="recurring" className="rounded" />
              <label htmlFor="recurring" className="text-sm text-zinc-700 cursor-pointer">Recurring annually</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
              <input name="description" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add Holiday</button>
          </form>
        </div>

        {/* Calendar View */}
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Upcoming Holidays</h2>
              </div>
              <div className="divide-y divide-zinc-100">
                {upcoming.map((h) => (
                  <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="text-center shrink-0 w-10">
                      <p className="text-xs text-zinc-400">{h.date.toLocaleDateString("en-GB", { month: "short" })}</p>
                      <p className="text-lg font-bold text-zinc-900 leading-none">{h.date.getDate()}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900">{h.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[h.type]}`}>{h.type}</span>
                        {h.isRecurring && <span className="rounded-full px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-400">Recurring</span>}
                      </div>
                    </div>
                    <form action={deleteHoliday.bind(null, h.id)}>
                      <DeleteButton className="text-xs text-red-500 hover:text-red-700" message="Delete this holiday?">×</DeleteButton>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900 text-zinc-400">Past Holidays</h2>
              </div>
              <div className="divide-y divide-zinc-100">
                {past.map((h) => (
                  <div key={h.id} className="px-4 py-3 flex items-center gap-3 opacity-60">
                    <p className="text-xs text-zinc-400 shrink-0">{h.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
                    <p className="text-sm text-zinc-600">{h.name}</p>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[h.type]}`}>{h.type}</span>
                    <form action={deleteHoliday.bind(null, h.id)}>
                      <DeleteButton className="text-xs text-red-500 hover:text-red-700 ml-2" message="Delete this holiday?">×</DeleteButton>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {holidays.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400">
              No holidays added yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
