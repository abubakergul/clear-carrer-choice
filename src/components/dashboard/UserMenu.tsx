"use client";

import { useRef, useState } from "react";
import UserAvatar from "@/components/ui/UserAvatar";
import { signOutAction } from "@/actions/auth";

type Props = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function UserMenu({ name, email, image }: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function onLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {/* Dropdown — opens upward */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-stone-100">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      )}

      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-stone-100 active:bg-stone-200"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <UserAvatar name={name} image={image} size={32} />
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-stone-900">
            {name ?? "User"}
          </p>
          {email && (
            <p className="truncate text-xs text-stone-400">{email}</p>
          )}
        </div>
        {/* Chevron */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  );
}
