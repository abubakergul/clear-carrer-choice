"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { triggerNextExploration } from "@/actions/exploration";

export default function ExplorationGenerator() {
  const router = useRouter();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    triggerNextExploration()
      .then(() => { router.refresh(); })
      .catch(() => {});
  }, [router]);

  return null;
}
