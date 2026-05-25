"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { claimAndGenerate } from "@/actions/conversation";

export default function ClaimPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  async function runClaim() {
    setFailed(false);
    const sessionId = sessionStorage.getItem("ccc_session_id");
    const result = await claimAndGenerate(sessionId);

    if (result.ok) {
      sessionStorage.removeItem("ccc_session_id");
      sessionStorage.removeItem("ccc_conv_id");
      router.replace("/result");
    } else if ("to" in result) {
      // Only clear session ID when redirecting to /result (done) or truly giving up
      if (result.to === "/result" || result.to === "/dashboard") {
        sessionStorage.removeItem("ccc_session_id");
        sessionStorage.removeItem("ccc_conv_id");
      }
      router.replace(result.to);
    } else {
      setFailed(true);
    }
  }

  useEffect(() => {
    runClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-stone-50 px-4">
        <div className="text-center">
          <p className="text-base font-semibold text-stone-800">We couldn&apos;t generate your insight yet.</p>
          <p className="mt-1 text-sm text-stone-500">Something went wrong on our end. Try again below.</p>
        </div>
        <button
          onClick={runClaim}
          className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:bg-violet-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 px-4">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
      </div>
      <p className="text-sm text-stone-500">Generating your insight…</p>
    </div>
  );
}
