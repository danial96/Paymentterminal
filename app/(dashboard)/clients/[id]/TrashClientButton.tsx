"use client";

export default function TrashClientButton({
  action,
  clientName,
}: {
  action: () => Promise<void>;
  clientName: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Move "${clientName}" to trash?`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
      >
        🗑 Delete Client
      </button>
    </form>
  );
}
