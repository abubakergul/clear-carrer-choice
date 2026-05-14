import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-stone-900">Dashboard</h1>
      <p className="mt-1 text-sm text-stone-500">
        Signed in as {session?.user?.email}
      </p>
    </div>
  );
}
