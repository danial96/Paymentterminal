"use client";
import { approveEmployee } from "@/app/actions/hrm-registration";

export default function ApproveButton({ employeeId }: { employeeId: number }) {
  async function handleApprove() {
    await approveEmployee(employeeId);
  }
  return (
    <form action={handleApprove}>
      <button type="submit" className="btn-brand rounded-md px-3 py-1.5 text-xs font-medium text-white">
        Approve
      </button>
    </form>
  );
}
