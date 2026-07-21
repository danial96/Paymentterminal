"use client";

import { useFormStatus } from "react-dom";

interface Props {
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

function Inner({ message, className, children }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ""}`}
      onClick={(e) => { if (!pending && !confirm(message ?? "Are you sure?")) e.preventDefault(); }}
    >
      {pending ? (
        <>
          <svg className="h-3 w-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Deleting...
        </>
      ) : (children ?? "Delete")}
    </button>
  );
}

export function DeleteButton(props: Props) {
  return <Inner {...props} />;
}
