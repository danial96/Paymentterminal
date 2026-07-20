import { requireUser } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { updateBankLetterStatus } from "@/app/actions/hrm-bank-letter";

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED:"bg-zinc-100 text-zinc-500",
};

export default async function BankLettersPage() {
  await requireUser();

  const requests = await prisma.hRMBankLetterRequest.findMany({
    include: {
      employee: {
        select: { firstName: true, lastName: true, employeeId: true, department: { select: { name: true } }, designation: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Bank Letter Requests</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{pending} pending request{pending !== 1 ? "s" : ""}</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Requested</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Note</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">HR Note</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">No requests yet.</td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{r.employee.firstName} {r.employee.lastName}</p>
                  <p className="text-xs text-zinc-400">{r.employee.employeeId} · {r.employee.department?.name ?? "—"}</p>
                  <p className="text-xs text-zinc-400">{r.employee.designation?.name ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 max-w-[160px]">
                  {r.notes ?? <span className="text-zinc-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[r.status] ?? "bg-zinc-100"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 max-w-[160px]">
                  {r.hrNote ?? <span className="text-zinc-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  {r.status === "PENDING" && (
                    <div className="flex flex-col gap-1.5">
                      <form action={async (fd: FormData) => {
                        "use server";
                        await updateBankLetterStatus(r.id, "APPROVED", fd.get("hrNote") ? String(fd.get("hrNote")) : undefined);
                      }} className="flex items-center gap-1">
                        <input name="hrNote" placeholder="Note (optional)" className="w-28 rounded border border-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-300" />
                        <button type="submit" className="text-xs font-medium text-green-600 hover:text-green-800 whitespace-nowrap">Approve</button>
                      </form>
                      <form action={async (fd: FormData) => {
                        "use server";
                        await updateBankLetterStatus(r.id, "REJECTED", fd.get("hrNote") ? String(fd.get("hrNote")) : undefined);
                      }} className="flex items-center gap-1">
                        <input name="hrNote" placeholder="Reason (optional)" className="w-28 rounded border border-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-300" />
                        <button type="submit" className="text-xs font-medium text-red-500 hover:text-red-700 whitespace-nowrap">Reject</button>
                      </form>
                      <form action={async () => {
                        "use server";
                        await updateBankLetterStatus(r.id, "CANCELLED");
                      }}>
                        <button type="submit" className="text-xs font-medium text-zinc-400 hover:text-zinc-600">Cancel</button>
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
