import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserMenu from "@/components/dashboard/UserMenu";
import ClaimRedirector from "@/components/dashboard/ClaimRedirector";
import SidebarNav from "@/components/dashboard/SidebarNav";

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
    <div className="flex h-screen overflow-hidden bg-[#F7F6F4]">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-white border-r border-stone-100">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-950">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="6"  cy="7" r="4" stroke="#c4b5fd" strokeWidth="1.2" />
              <circle cx="10" cy="7" r="4" stroke="#a78bfa" strokeWidth="1.2" opacity="0.6" />
              <circle cx="8"  cy="10" r="4" stroke="#7c3aed" strokeWidth="1.2" opacity="0.3" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-stone-900 leading-tight">
            ClearCareer<br />
            <span className="text-stone-400 font-medium">Choice</span>
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 px-2 py-1">
          <SidebarNav />
        </div>

        {/* User */}
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
