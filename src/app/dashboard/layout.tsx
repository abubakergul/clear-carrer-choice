import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserMenu from "@/components/dashboard/UserMenu";
import ClaimRedirector from "@/components/dashboard/ClaimRedirector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-stone-100 bg-white">
        {/* Branding */}
        <div className="px-5 py-5">
          <span className="text-sm font-semibold tracking-tight text-stone-900">
            ClearCareerChoice
          </span>
        </div>

        {/* Nav — expanded in feature 09-dashboard */}
        <nav className="flex-1 px-3 py-2" />

        {/* User section */}
        <div className="border-t border-stone-100 px-3 py-3">
          <UserMenu
            name={session.user?.name}
            email={session.user?.email}
            image={session.user?.image}
          />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <ClaimRedirector />
        {children}
      </main>
    </div>
  );
}
