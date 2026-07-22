"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Employee { id: number; firstName: string; lastName: string; employeeId: string; }
interface Department { id: number; name: string; }

interface Props {
  employees: Employee[];
  departments: Department[];
  currentEmp?: string;
  currentDept?: string;
  currentFrom: string;
  currentTo: string;
  isRange: boolean;
}

export default function AttendanceFilters({ employees, departments, currentEmp, currentDept, currentFrom, currentTo, isRange }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const from = fd.get("from") as string;
    const to = fd.get("to") as string;
    const emp = fd.get("emp") as string;
    const dept = fd.get("dept") as string;
    if (from) params.set("from", from);
    if (to && to !== from) params.set("to", to);
    if (emp) params.set("emp", emp);
    if (dept) params.set("dept", dept);
    startTransition(() => {
      router.push(`/hrm/attendance?${params.toString()}`);
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center flex-wrap">
      <div className="flex items-center gap-1">
        <label className="text-xs text-zinc-500 whitespace-nowrap">From</label>
        <input
          name="from"
          type="date"
          defaultValue={currentFrom}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div className="flex items-center gap-1">
        <label className="text-xs text-zinc-500 whitespace-nowrap">To</label>
        <input
          name="to"
          type="date"
          defaultValue={currentTo}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <select name="emp" defaultValue={currentEmp} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 w-52">
        <option value="">All Employees</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
        ))}
      </select>
      <select name="dept" defaultValue={currentDept} className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400">
        <option value="">All Departments</option>
        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="btn-brand rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60 flex items-center gap-1.5"
      >
        {pending && (
          <svg className="h-3.5 w-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {pending ? "Loading..." : "Filter"}
      </button>
      <Link href="/hrm/attendance" className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Today</Link>
    </form>
  );
}
