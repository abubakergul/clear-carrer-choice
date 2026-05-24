"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClaimRedirector() {
  const router = useRouter();

  useEffect(() => {
    const sessionId = sessionStorage.getItem("ccc_session_id");
    if (sessionId) {
      router.replace("/claim");
    }
  }, [router]);

  return null;
}
