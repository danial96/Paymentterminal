"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

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
        <FontAwesomeIcon icon={faTrash} className="mr-1.5 h-4 w-4" />Delete Client
      </button>
    </form>
  );
}
