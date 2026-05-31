export default function DashboardLoading() {
  return (
    <div className="min-h-full animate-pulse px-10 py-9">
      <div className="mb-9 flex items-end justify-between">
        <div>
          <div className="h-7 w-44 rounded-lg bg-stone-100" />
          <div className="mt-2 h-4 w-52 rounded bg-stone-100" />
        </div>
        <div className="h-4 w-24 rounded bg-stone-100" />
      </div>
      <div className="mb-6 h-11 rounded-xl bg-stone-100" />
      <div className="mb-3 h-2.5 w-16 rounded bg-stone-100" />
      <div className="h-60 rounded-2xl bg-stone-100" />
    </div>
  );
}
