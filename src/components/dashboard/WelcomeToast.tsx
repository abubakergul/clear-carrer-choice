"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Toast } from "@/components/ui/Toast";

function WelcomeToastInner() {
  const params = useSearchParams();
  if (!params.has("welcome")) return null;
  return <Toast message="Welcome back!" />;
}

export function WelcomeToast() {
  return (
    <Suspense>
      <WelcomeToastInner />
    </Suspense>
  );
}
