"use client";

type Props = { variant: "pattern" | "continue" };

const CONTENT = {
  pattern: {
    icon: "✦",
    heading: "I'm starting to see a pattern.",
    subtext:
      "Sign up to see what I found — and get a 7-day plan to test if it actually fits you.",
    cta: "See my results →",
  },
  continue: {
    icon: "◎",
    heading: "We've started something.",
    subtext:
      "Sign up to keep going. The more you share, the clearer the picture gets — and the closer you get to knowing what actually fits.",
    cta: "Continue the conversation →",
  },
};

export default function SignupWall({ variant }: Props) {
  const c = CONTENT[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-white px-8 pb-10 pt-8 shadow-2xl sm:rounded-3xl">

        {/* Mobile drag handle */}
        <div className="mb-6 flex justify-center sm:hidden">
          <div className="h-1 w-10 rounded-full bg-stone-200" />
        </div>

        <div className="flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-xl text-violet-600">
              {c.icon}
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-bold tracking-tight text-stone-900">
                {c.heading}
              </h2>
              <p className="text-sm leading-relaxed text-stone-500">
                {c.subtext}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="/auth/signup"
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              {c.cta}
            </a>
            <a
              href="/auth/login"
              className="w-full rounded-xl border border-stone-200 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
            >
              Already have an account? Log in
            </a>
          </div>

          <p className="text-xs text-stone-400">Free. No card required.</p>
        </div>
      </div>
    </div>
  );
}
