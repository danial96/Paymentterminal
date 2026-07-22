"use client";

interface Wish {
  id: number;
  message: string;
  createdAt: string;
  from: { firstName: string; lastName: string };
}

export default function AnniversaryWishes({ wishes }: { wishes: Wish[] }) {
  if (wishes.length === 0) {
    return (
      <div className="rounded-2xl border border-purple-200 p-5" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #e0f7fa 100%)" }}>
        <p className="text-sm font-bold text-zinc-800 mb-1">Congratulations from Colleagues</p>
        <p className="text-xs text-zinc-400">No messages yet — they&apos;re on their way!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-200 p-5" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #e0f7fa 100%)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#503d98]/10">
          <svg className="text-[#503d98]" fill="currentColor" viewBox="0 0 24 24" style={{ height: "16px", width: "16px" }}>
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900">
            {wishes.length} {wishes.length === 1 ? "Message" : "Messages"} from Colleagues
          </p>
          <p className="text-[11px] text-zinc-500">Your team is celebrating your milestone!</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {wishes.map((w) => (
          <div key={w.id} className="rounded-xl bg-white border border-purple-100 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[#503d98] bg-purple-100 shrink-0">
                {w.from.firstName[0]}{w.from.lastName[0]}
              </div>
              <p className="text-xs font-semibold text-zinc-800">{w.from.firstName} {w.from.lastName}</p>
              <p className="text-[10px] text-zinc-400 ml-auto">
                {new Date(w.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <p className="text-sm text-zinc-700 pl-9 leading-relaxed">{w.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
