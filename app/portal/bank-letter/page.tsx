import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitBankLetterRequest } from "@/app/actions/hrm-bank-letter";

const STATUS_STYLES: Record<string, { badge: string; label: string; desc: string }> = {
  PENDING:  { badge: "bg-yellow-100 text-yellow-800", label: "Pending",  desc: "Your request has been submitted. HR will process it soon." },
  APPROVED: { badge: "bg-green-100 text-green-800",  label: "Approved",  desc: "Your letter has been approved. Collect it from HR." },
  REJECTED: { badge: "bg-red-100 text-red-800",      label: "Rejected",  desc: "Your request was rejected." },
  CANCELLED:{ badge: "bg-zinc-100 text-zinc-500",    label: "Cancelled", desc: "This request was cancelled." },
};

export default async function BankLetterPage() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const [activeRequest, history] = await Promise.all([
    prisma.hRMBankLetterRequest.findFirst({
      where: { employeeId: empId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hRMBankLetterRequest.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasPending = !!activeRequest;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold text-zinc-900">Bank Account Opening Letter</h1>

      {/* Active request status */}
      {activeRequest && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[activeRequest.status].badge}`}>
              {STATUS_STYLES[activeRequest.status].label}
            </span>
            <span className="text-xs text-zinc-400">
              Submitted {activeRequest.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <p className="text-sm text-zinc-700">{STATUS_STYLES[activeRequest.status].desc}</p>
          {activeRequest.notes && (
            <p className="text-xs text-zinc-500 mt-2">Your note: {activeRequest.notes}</p>
          )}
        </div>
      )}

      {/* Request form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-1">Request a Letter</h2>
        <p className="text-xs text-zinc-500 mb-4">
          HR will personally provide you with the bank account opening letter.
        </p>

        {hasPending ? (
          <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm text-zinc-500">
            You already have a pending request. You can submit a new one once HR processes your current request.
          </div>
        ) : (
          <form action={submitBankLetterRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Additional Notes <span className="text-zinc-400">(optional)</span>
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
                placeholder="e.g. preferred bank, branch, or any other info for HR..."
              />
            </div>
            <button
              type="submit"
              className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
            >
              Submit Request
            </button>
          </form>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Request History</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {history.map((r) => {
              const s = STATUS_STYLES[r.status] ?? STATUS_STYLES.CANCELLED;
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>{s.label}</span>
                    <span className="text-xs text-zinc-400">
                      {r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.hrNote && (
                    <p className="text-xs text-zinc-600 mt-1">HR: {r.hrNote}</p>
                  )}
                  {r.notes && (
                    <p className="text-xs text-zinc-400 mt-0.5">Your note: {r.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
