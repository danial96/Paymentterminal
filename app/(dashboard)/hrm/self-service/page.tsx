"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark, faClipboardList, faCalendar, faMoneyBill } from "@fortawesome/free-solid-svg-icons";

export default function SelfServicePage() {
  const [time, setTime] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("hrm_checkin");
  });
  const [checkInTime, setCheckInTime] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("hrm_checkin");
    return saved ? new Date(saved) : null;
  });
  const [working, setWorking] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("hrm_checkin");
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = checkInTime ? Math.floor((time.getTime() - checkInTime.getTime()) / 1000) : 0;
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  async function handleCheckIn() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/hrm/checkin", { method: "POST" });
      if (!res.ok) throw new Error("Check-in failed");
      const now = new Date();
      setCheckedIn(true);
      setCheckInTime(now);
      setWorking(true);
      localStorage.setItem("hrm_checkin", now.toISOString());
      setStatus("done");
    } catch (e) {
      setError("Check-in failed. Please try again.");
      setStatus("idle");
    }
  }

  async function handleCheckOut() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/hrm/checkout", { method: "POST" });
      if (!res.ok) throw new Error("Check-out failed");
      setCheckedIn(false);
      setWorking(false);
      localStorage.removeItem("hrm_checkin");
      setStatus("done");
      setCheckInTime(null);
    } catch (e) {
      setError("Check-out failed. Please try again.");
      setStatus("idle");
    }
  }

  const dayName = time.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = time.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Employee Self Service</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Check In/Out Card */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-400">{dayName}</p>
          <p className="text-lg font-semibold text-zinc-700">{dateStr}</p>
          <p className="text-5xl font-bold text-zinc-900 mt-3 font-mono tabular-nums">{timeStr}</p>

          {working && checkInTime && (
            <div className="mt-4">
              <p className="text-xs text-zinc-400">Working time</p>
              <p className="text-3xl font-bold text-zinc-700 font-mono tabular-nums mt-1">
                {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Checked in at {checkInTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-zinc-700 bg-zinc-100 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="mt-8 flex justify-center gap-4">
            {!checkedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={status === "loading"}
                className="rounded-xl bg-zinc-900 px-10 py-4 text-base font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors shadow-lg shadow-zinc-100"
              >
                {status === "loading" ? "Processing…" : <><FontAwesomeIcon icon={faCheck} className="mr-1.5 h-4 w-4" />Check In</>}
              </button>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={status === "loading"}
                className="rounded-xl bg-zinc-700 px-10 py-4 text-base font-semibold text-white hover:bg-zinc-600 disabled:opacity-60 transition-colors shadow-lg"
              >
                {status === "loading" ? "Processing…" : <><FontAwesomeIcon icon={faXmark} className="mr-1.5 h-4 w-4" />Check Out</>}
              </button>
            )}
          </div>

          <p className="mt-4 text-xs text-zinc-400">
            {checkedIn ? "You are currently checked in" : "You are not checked in today"}
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          {[
            { href: "/hrm/self-service/attendance", label: "My Attendance", icon: faClipboardList, desc: "View your attendance history" },
            { href: "/hrm/self-service/leaves", label: "Leave Requests", icon: faCalendar, desc: "Apply & track leaves" },
            { href: "/hrm/self-service/payslips", label: "My Payslips", icon: faMoneyBill, desc: "Download salary slips" },
          ].map(({ href, label, icon, desc }) => (
            <Link key={href} href={href} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 hover:shadow-md transition-shadow">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-700"><FontAwesomeIcon icon={icon} className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{label}</p>
                <p className="text-xs text-zinc-400">{desc}</p>
              </div>
              <svg className="ml-auto h-4 w-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
