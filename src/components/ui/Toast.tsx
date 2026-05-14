"use client";

import { useEffect, useState } from "react";

type Props = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
};

export function Toast({ message, type = "success", duration = 3000 }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  const styles = {
    success: "bg-green-50 text-green-800 ring-green-200",
    error: "bg-red-50 text-red-800 ring-red-200",
    info: "bg-violet-50 text-violet-800 ring-violet-200",
  };

  return (
    <div
      className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-md ring-1 anim-fade-in ${styles[type]}`}
    >
      {message}
    </div>
  );
}
