"use client";

import { useTransition, useState } from "react";
import { sendAnniversaryWish } from "@/app/actions/hrm-anniversary-wishes";

interface AnniversaryPerson {
  id: number;
  firstName: string;
  lastName: string;
  years: number;
}

interface Props {
  anniversaryPeople: AnniversaryPerson[];
  alreadyComplimentedIds: number[];
}

export default function AnniversaryWishSender({ anniversaryPeople, alreadyComplimentedIds }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [complimented, setComplimented] = useState<Set<number>>(new Set(alreadyComplimentedIds));
  const [isPending, startTransition] = useTransition();
  const [successId, setSuccessId] = useState<number | null>(null);

  function handleSend(toId: number) {
    const message = (messages[toId] ?? "").trim() || `Congratulations on your work anniversary! Your dedication inspires us all.`;
    const fd = new FormData();
    fd.set("toId", String(toId));
    fd.set("message", message);

    startTransition(async () => {
      await sendAnniversaryWish(fd);
      setComplimented((prev) => new Set([...prev, toId]));
      setOpenId(null);
      setSuccessId(toId);
      setTimeout(() => setSuccessId(null), 3000);
    });
  }

  return (
    <div className="rounded-2xl border border-purple-200 p-5" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #e0f7fa 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#503d98]/10 border border-[#503d98]/20">
          <svg className="h-4.5 w-4.5 text-[#503d98]" fill="currentColor" viewBox="0 0 24 24" style={{ height: "18px", width: "18px" }}>
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900">
            {anniversaryPeople.length === 1
              ? `${anniversaryPeople[0].firstName} is celebrating a Work Anniversary!`
              : `${anniversaryPeople.length} colleagues are celebrating Work Anniversaries!`}
          </p>
          <p className="text-[11px] text-zinc-500">Send them your congratulations</p>
        </div>
      </div>

      <div className="space-y-3">
        {anniversaryPeople.map((person) => {
          const hasSent = complimented.has(person.id);
          const isOpen = openId === person.id;
          const isSuccess = successId === person.id;

          return (
            <div key={person.id} className="rounded-xl bg-white border border-purple-100 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-[#503d98] bg-purple-100 shrink-0">
                  {person.firstName[0]}{person.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{person.firstName} {person.lastName}</p>
                  <p className="text-[11px] text-zinc-400">
                    {person.years} year{person.years !== 1 ? "s" : ""} at IKIA Tech
                    {isSuccess && <span className="text-emerald-600 font-medium ml-2">Congratulations sent!</span>}
                  </p>
                </div>
                {hasSent ? (
                  <span className="rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-1 text-[11px] font-semibold flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Sent
                  </span>
                ) : (
                  <button
                    onClick={() => setOpenId(isOpen ? null : person.id)}
                    className="rounded-full px-3 py-1 text-[11px] font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #503d98, #29c0d5)" }}
                  >
                    {isOpen ? "Cancel" : "Congratulate"}
                  </button>
                )}
              </div>

              {isOpen && !hasSent && (
                <div className="border-t border-purple-100 px-4 pb-3 pt-2 bg-purple-50/40">
                  <textarea
                    rows={2}
                    value={messages[person.id] ?? ""}
                    onChange={(e) => setMessages((prev) => ({ ...prev, [person.id]: e.target.value }))}
                    placeholder="Congratulations on your work anniversary! Your dedication inspires us all."
                    className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setOpenId(null)} className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-1">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSend(person.id)}
                      disabled={isPending}
                      className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 flex items-center gap-1.5 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #503d98, #29c0d5)" }}
                    >
                      {isPending && (
                        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                      Send
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
