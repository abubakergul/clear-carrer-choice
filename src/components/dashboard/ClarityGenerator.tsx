"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateClarityOutput } from "@/actions/exploration";

export default function ClarityGenerator() {
  const router = useRouter();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    generateClarityOutput().then(() => {
      router.refresh();
    }).catch(() => {});

    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
