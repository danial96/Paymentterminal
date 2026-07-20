import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { createPerformanceReview, deletePerformanceReview } from "@/app/actions/hrm-performance";
import { DeleteButton } from "@/app/(dashboard)/hrm/components/DeleteButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarEmpty } from "@fortawesome/free-regular-svg-icons";

const RATING_LABELS: Record<number, string> = { 1: "Poor", 2: "Below Average", 3: "Average", 4: "Good", 5: "Excellent" };
const RATING_COLORS: Record<number, string> = {
  1: "text-zinc-600", 2: "text-zinc-500", 3: "text-zinc-500", 4: "text-zinc-700", 5: "text-zinc-700"
};

export default async function PerformancePage() {
  await requireUser();
  const [reviews, employees] = await Promise.all([
    prisma.hRMPerformance.findMany({
      orderBy: { createdAt: "desc" },
      include: { employee: { include: { department: true, designation: true } } },
    }),
    prisma.hRMEmployee.findMany({ where: { deletedAt: null, status: "ACTIVE" }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
  ]);

  const now = new Date();
  const currentPeriods = [
    `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`,
    `${now.getFullYear()}-Annual`,
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Performance Reviews</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Add Review Form */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Add Review</h2>
          <form action={createPerformanceReview} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Employee *</label>
              <select name="employeeId" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="">Select</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Review Period *</label>
              <input name="reviewPeriod" required list="periods" placeholder="e.g. 2025-Q2" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              <datalist id="periods">{currentPeriods.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Type</label>
              <select name="reviewType" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUAL">Annual</option>
                <option value="PROBATION">Probation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Rating (1–5) *</label>
              <select name="rating" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} — {RATING_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Goals</label>
              <textarea name="goals" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Achievements</label>
              <textarea name="achievements" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Areas for Improvement</label>
              <textarea name="improvements" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Manager Comment</label>
              <textarea name="managerComment" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
            </div>
            <button type="submit" className="btn-brand w-full rounded-lg py-2 text-sm font-medium text-white">Add Review</button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="col-span-2 space-y-3">
          {reviews.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-400">No reviews yet</div>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-700 shrink-0">
                  {r.employee.firstName[0]}{r.employee.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{r.employee.firstName} {r.employee.lastName}</p>
                      <p className="text-xs text-zinc-400">{r.employee.designation?.name ?? "—"} · {r.employee.department?.name ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${RATING_COLORS[r.rating]}`}>
                          {Array.from({ length: r.rating }).map((_, i) => <FontAwesomeIcon key={`f${i}`} icon={faStar} className="h-4 w-4" />)}
                          {Array.from({ length: 5 - r.rating }).map((_, i) => <FontAwesomeIcon key={`e${i}`} icon={faStarEmpty} className="h-4 w-4" />)}
                        </p>
                        <p className={`text-xs font-medium ${RATING_COLORS[r.rating]}`}>{RATING_LABELS[r.rating]}</p>
                      </div>
                      <form action={deletePerformanceReview.bind(null, r.id)}>
                        <DeleteButton className="text-xs text-red-400 hover:text-red-600 ml-2" message="Delete this review?">×</DeleteButton>
                      </form>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded px-2 py-0.5 text-[10px] bg-zinc-50 text-zinc-700 font-medium">{r.reviewPeriod}</span>
                    <span className="rounded px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-500">{r.reviewType}</span>
                    <span className="text-[10px] text-zinc-400">{r.reviewDate?.toLocaleDateString("en-GB")}</span>
                  </div>
                  {r.managerComment && (
                    <p className="mt-2 text-xs text-zinc-600 bg-zinc-50 rounded-lg p-2">{r.managerComment}</p>
                  )}
                  {(r.achievements || r.improvements) && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {r.achievements && (
                        <div className="text-xs">
                          <p className="text-zinc-400 font-medium mb-0.5">Achievements</p>
                          <p className="text-zinc-600">{r.achievements}</p>
                        </div>
                      )}
                      {r.improvements && (
                        <div className="text-xs">
                          <p className="text-zinc-400 font-medium mb-0.5">Areas to Improve</p>
                          <p className="text-zinc-600">{r.improvements}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
