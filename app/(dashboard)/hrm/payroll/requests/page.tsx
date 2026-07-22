import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import PayslipRequestActions from "./PayslipRequestActions";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  FULFILLED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default async function PayslipRequestsPage() {
  await requireUser();

  const requests = await prisma.hRMPayslipRequest.findMany({
    include: {
      employee: { select: { firstName: true, lastName: true, employeeId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = requests.filter((r) => r.status === "PENDING");
  const done = requests.filter((r) => r.status !== "PENDING");

  function periodLabel(req: typeof requests[0]) {
    const from = `${MONTHS_SHORT[req.month - 1]} ${req.year}`;
    if (req.toMonth && req.toYear) return `${from} → ${MONTHS_SHORT[req.toMonth - 1]} ${req.toYear}`;
    return from;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Payslip Requests</h1>

      {/* Pending */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          Pending ({pending.length})
        </p>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
            No pending requests.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {req.employee.firstName} {req.employee.lastName}
                      <span className="ml-2 text-xs text-zinc-400 font-normal">{req.employee.employeeId}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Period: <span className="font-medium text-zinc-700">{periodLabel(req)}</span>
                      <span className="ml-3 text-zinc-400">Requested {req.createdAt.toLocaleDateString()}</span>
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[req.status]}`}>
                    {req.status}
                  </span>
                </div>
                <PayslipRequestActions id={req.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">History</p>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">HR Note</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {done.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-900">
                      {req.employee.firstName} {req.employee.lastName}
                      <span className="ml-1 text-xs text-zinc-400">{req.employee.employeeId}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{periodLabel(req)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[req.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-[220px] truncate">{req.hrNote ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{req.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
