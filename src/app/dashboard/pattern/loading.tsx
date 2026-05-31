export default function PatternLoading() {
  return (
    <div className="min-h-full animate-pulse px-10 py-9">
      <div className="mb-10">
        <div className="mb-3 h-5 w-28 rounded-full bg-stone-100" />
        <div className="h-8 w-52 rounded-lg bg-stone-100" />
        <div className="mt-2 h-4 w-64 rounded bg-stone-100" />
      </div>
      <div className="mb-3 h-2.5 w-32 rounded bg-stone-100" />
      <div className="mb-8 flex flex-col gap-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-stone-100" />)}
      </div>
      <div className="mb-3 h-2.5 w-44 rounded bg-stone-100" />
      <div className="flex flex-col gap-2">
        {[0, 1].map((i) => <div key={i} className="h-14 rounded-xl bg-stone-100" />)}
      </div>
    </div>
  );
}
