"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    label: "Home",
    href: "/dashboard",
    match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/explore"),
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path
          d="M1.5 6.25L7.5 1.5l6 4.75V13a.5.5 0 0 1-.5.5H9.5V9.5h-3V13.5H2a.5.5 0 0 1-.5-.5V6.25Z"
          stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "My Pattern",
    href: "/dashboard/pattern",
    match: (p: string) => p === "/dashboard/pattern" || p === "/dashboard/clarity",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="5.5" cy="7.5" r="4" stroke="currentColor" strokeWidth="1.15" />
        <circle cx="9.5" cy="7.5" r="4" stroke="currentColor" strokeWidth="1.15" opacity="0.45" />
      </svg>
    ),
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-0.5">
      <p className="mb-1 px-3 pt-1 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
        Navigate
      </p>
      {NAV.map((item) => {
        const active = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all ${
              active
                ? "bg-stone-100 font-semibold text-stone-900"
                : "font-medium text-stone-400 hover:bg-stone-50 hover:text-stone-700"
            }`}
          >
            <span className={`transition-colors ${active ? "text-stone-600" : "text-stone-300 group-hover:text-stone-500"}`}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
