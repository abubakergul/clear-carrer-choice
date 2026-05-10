import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {session.user?.email}</p>
    </main>
  );
}
