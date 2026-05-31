'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const SEEN_KEY = 'ccc_milestone_seen';

export default function MilestoneBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SEEN_KEY)) {
      sessionStorage.setItem(SEEN_KEY, SEEN_KEY);
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/dashboard/pattern"
      className="mb-7 flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50 px-5 py-3.5 text-sm text-violet-800 transition hover:bg-violet-100"
    >
      <span>A pattern is forming — see what we&apos;ve noticed about you →</span>
    </Link>
  );
}
