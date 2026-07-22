import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PayslipRequestForm from "./PayslipRequestForm";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  FULFILLED: "bg-zinc-900 text-white",
  REJECTED: "bg-zinc-200 text-zinc-600",
};

export default async function PortalPayslipRequestPage() {
  const session = await auth();
  const empId = Number((session?.user as any)?.employeeId);

  const requests = await prisma.hRMPayslipRequest.findMany({
    where: { employeeId: empId },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Payslip Request</h1>

      {/* Request form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">
          Request a Payslip
        </h2>
        <PayslipRequestForm currentMonth={now.getMonth() + 1} currentYear={currentYear} years={years} />
      </div>

      {/* History */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Request History</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Period</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Requested</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">HR Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  No payslip requests yet.
                </td>
              </tr>
            )}
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-900">
                  {MONTHS_SHORT[req.month - 1]} {req.year}
                  {req.toMonth && req.toYear && (
                    <span className="text-zinc-400"> → {MONTHS_SHORT[req.toMonth - 1]} {req.toYear}</span>
                  )}
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
                <td className="px-4 py-3 text-zinc-400 text-xs">{req.hrNote ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
