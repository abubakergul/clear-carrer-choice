import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 pb-16 text-center"
      style={{
        background: "radial-gradient(ellipse at 50% 35%, #f5f3ff 0%, #fafafa 60%, #f3f4f6 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">

        {/* Eyebrow */}
        <p
          className="anim-fade-in text-xs font-semibold uppercase tracking-widest text-violet-400"
          style={{ animationDelay: "100ms" }}
        >
          Most people get this wrong
        </p>

        {/* Headline */}
        <h1
          className="anim-fade-up text-4xl font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-5xl"
          style={{ animationDelay: "200ms" }}
        >
          You&apos;re{" "}
          <span className="font-extrabold text-[--color-accent]">guessing</span>{" "}
          your future. And it&apos;s costing you.
        </h1>

        {/* Subtext */}
        <p
          className="anim-fade-in text-lg leading-relaxed text-gray-500 sm:text-xl"
          style={{ animationDelay: "350ms" }}
        >
          This helps you test what actually fits — before you waste years going
          the wrong direction.
        </p>

        {/* CTA */}
        <div
          className="anim-fade-in flex flex-col items-center gap-3 pt-2"
          style={{ animationDelay: "480ms" }}
        >
          <Link
            href="/chat"
            className="rounded-2xl px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-200 transition-transform duration-150 hover:scale-105 active:scale-95"
            style={{ background: "var(--accent)" }}
          >
            Try it →
          </Link>
          <p className="text-sm text-gray-400">
            Takes 3 minutes. No account. No pressure.
          </p>
        </div>

      </div>
    </main>
  );
}
