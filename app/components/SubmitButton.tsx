"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function SubmitButton({ children, className = "", pendingText, disabled, style }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      style={style}
      className={`relative inline-flex items-center justify-center gap-2 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {pending && (
        <svg className="h-3.5 w-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
