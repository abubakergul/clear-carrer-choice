"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CoolDownTimer({ endsAt }: { endsAt: number }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(endsAt - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const r = endsAt - Date.now();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, router]);

  return (
    <span className="font-mono text-3xl font-bold tracking-widest text-violet-600">
      {formatTime(remaining)}
    </span>
  );
}
