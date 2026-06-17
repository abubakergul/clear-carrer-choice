import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserMenu from "@/components/dashboard/UserMenu";
import ClaimRedirector from "@/components/dashboard/ClaimRedirector";
import SidebarNav from "@/components/dashboard/SidebarNav";
import { LogoMark } from "@/components/Logo";

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
          <LogoMark size={28} />
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
