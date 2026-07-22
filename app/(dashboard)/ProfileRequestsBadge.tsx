"use client";

import { useEffect, useState } from "react";

export default function ProfileRequestsBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchCount() {
      try {
        const res = await fetch("/api/hrm/profile-requests/count");
        const data = await res.json();
        if (active) setCount(data.count ?? 0);
      } catch {}
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (count === 0) return null;
  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}
