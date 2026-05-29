export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-xl px-6 py-10 animate-pulse">
      <div className="mb-8 h-4 w-24 rounded-full bg-stone-100" />
      <div className="mb-2 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-stone-100" />
        <div className="h-6 w-20 rounded-full bg-stone-100" />
      </div>
      <div className="mb-6 h-8 w-3/4 rounded-lg bg-stone-100" />
      <div className="mb-8 rounded-2xl bg-stone-50 px-6 py-5">
        <div className="flex flex-col gap-3">
          <div className="h-4 w-full rounded bg-stone-100" />
          <div className="h-4 w-5/6 rounded bg-stone-100" />
          <div className="h-4 w-4/6 rounded bg-stone-100" />
        </div>
      </div>
      <div className="h-10 w-40 rounded-xl bg-stone-100" />
    </div>
  );
}
