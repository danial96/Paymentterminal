"use client";

interface Wish {
  id: number;
  message: string;
  createdAt: string;
  from: { firstName: string; lastName: string };
}

export default function BirthdayWishes({ wishes }: { wishes: Wish[] }) {
  if (wishes.length === 0) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-5">
        <p className="text-sm font-bold text-zinc-800 mb-1">Wishes from Colleagues</p>
        <p className="text-xs text-zinc-400">No wishes yet — they&apos;re on their way!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden>💌</span>
        <div>
          <p className="text-sm font-bold text-zinc-900">
            {wishes.length} {wishes.length === 1 ? "Wish" : "Wishes"} from Colleagues
          </p>
          <p className="text-[11px] text-zinc-500">Your team is celebrating with you!</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {wishes.map((w) => (
          <div key={w.id} className="rounded-xl bg-white border border-pink-100 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-pink-600 bg-pink-100 shrink-0">
                {w.from.firstName[0]}{w.from.lastName[0]}
              </div>
              <p className="text-xs font-semibold text-zinc-800">{w.from.firstName} {w.from.lastName}</p>
              <p className="text-[10px] text-zinc-400 ml-auto">
                {new Date(w.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" })}
              </p>
            </div>
            <p className="text-sm text-zinc-700 pl-9 leading-relaxed">{w.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
