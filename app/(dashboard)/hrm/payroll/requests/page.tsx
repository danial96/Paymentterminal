import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { fulfillPayslipRequest, rejectPayslipRequest } from "@/app/actions/hrm-payslip-request";
import { SubmitButton } from "@/app/components/SubmitButton";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  FULFILLED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default async function PayslipRequestsPage() {
  await requireUser();

  const requests = await prisma.hRMPayslipRequest.findMany({
    include: {
      employee: {
        select: { firstName: true, lastName: true, id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Payslip Requests</h1>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Period</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Requested</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">HR Note</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No payslip requests found.
                </td>
              </tr>
            )}
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-900">
                  {req.employee.firstName} {req.employee.lastName}
                  <span className="ml-1 text-xs text-zinc-400">#{req.employee.id}</span>
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {MONTHS_SHORT[req.month - 1]} {req.year}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {req.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      STATUS_STYLES[req.status] ?? "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs max-w-[160px] truncate">
                  {req.hrNote ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {req.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await fulfillPayslipRequest(req.id);
                        }}
                      >
                        <SubmitButton className="rounded-md px-3 py-1 text-xs font-medium text-white" style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }} pendingText="...">
                          Fulfill
                        </SubmitButton>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await rejectPayslipRequest(req.id);
                        }}
                      >
                        <SubmitButton className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50" pendingText="...">
                          Reject
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
