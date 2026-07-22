"use client";

import { useTransition, useState } from "react";
import { sendBirthdayWish } from "@/app/actions/hrm-birthday-wishes";

interface BirthdayPerson {
  id: number;
  firstName: string;
  lastName: string;
}

interface Props {
  birthdayPeople: BirthdayPerson[];
  alreadyWished: number[]; // toIds already wished this year
}

export default function BirthdayWishSender({ birthdayPeople, alreadyWished }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [wished, setWished] = useState<Set<number>>(new Set(alreadyWished));
  const [isPending, startTransition] = useTransition();
  const [successId, setSuccessId] = useState<number | null>(null);

  function handleSend(toId: number) {
    const message = (messages[toId] ?? "").trim() || `Happy Birthday! Wishing you a wonderful day! 🎂`;
    const fd = new FormData();
    fd.set("toId", String(toId));
    fd.set("message", message);

    startTransition(async () => {
      await sendBirthdayWish(fd);
      setWished((prev) => new Set([...prev, toId]));
      setOpenId(null);
      setSuccessId(toId);
      setTimeout(() => setSuccessId(null), 3000);
    });
  }

  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden>🎂</span>
        <div>
          <p className="text-sm font-bold text-zinc-900">
            {birthdayPeople.length === 1
              ? `Today is ${birthdayPeople[0].firstName}'s Birthday!`
              : `${birthdayPeople.length} colleagues have birthdays today!`}
          </p>
          <p className="text-[11px] text-zinc-500">Send them a warm wish</p>
        </div>
      </div>

      <div className="space-y-3">
        {birthdayPeople.map((person) => {
          const hasWished = wished.has(person.id);
          const isOpen = openId === person.id;
          const isSuccess = successId === person.id;

          return (
            <div key={person.id} className="rounded-xl bg-white border border-pink-100 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-pink-600 bg-pink-100 shrink-0">
                  {person.firstName[0]}{person.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{person.firstName} {person.lastName}</p>
                  {isSuccess && (
                    <p className="text-[11px] text-emerald-600 font-medium">Wish sent!</p>
                  )}
                </div>
                {hasWished ? (
                  <span className="rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-1 text-[11px] font-semibold flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Wished
                  </span>
                ) : (
                  <button
                    onClick={() => setOpenId(isOpen ? null : person.id)}
                    className="rounded-full px-3 py-1 text-[11px] font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #f472b6, #a855f7)" }}
                  >
                    {isOpen ? "Cancel" : "Send Wish"}
                  </button>
                )}
              </div>

              {/* Inline wish form */}
              {isOpen && !hasWished && (
                <div className="border-t border-pink-100 px-4 pb-3 pt-2 bg-pink-50/50">
                  <textarea
                    rows={2}
                    value={messages[person.id] ?? ""}
                    onChange={(e) => setMessages((prev) => ({ ...prev, [person.id]: e.target.value }))}
                    placeholder="Happy Birthday! Wishing you a wonderful day! 🎂"
                    className="w-full rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setOpenId(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSend(person.id)}
                      disabled={isPending}
                      className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 flex items-center gap-1.5 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #f472b6, #a855f7)" }}
                    >
                      {isPending && (
                        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                      Send Wish
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
