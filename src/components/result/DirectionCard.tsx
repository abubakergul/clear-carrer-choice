"use client";

type Props = {
  label: string;
  index: number;
};

export default function DirectionCard({ label, index }: Props) {
  return (
    <div className="rounded-xl border-l-4 border-violet-300 bg-white shadow-sm">
      <div className="flex items-center gap-4 px-4 py-4">
        <span className="shrink-0 text-sm font-black text-violet-300">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="flex-1 text-sm font-semibold text-stone-800">{label}</p>
      </div>
    </div>
  );
}
