"use client";
import { approveEmployee } from "@/app/actions/hrm-registration";
import { SubmitButton } from "@/app/components/SubmitButton";

export default function ApproveButton({ employeeId }: { employeeId: number }) {
  async function handleApprove() {
    await approveEmployee(employeeId);
  }
  return (
    <form action={handleApprove}>
      <SubmitButton className="btn-brand rounded-md px-3 py-1.5 text-xs font-medium text-white" pendingText="Approving...">
        Approve
      </SubmitButton>
    </form>
  );
}
