import { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { logOut } from "@/actions/auth";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationService } from "@/services/NotificationService";
import { GlobalSearch } from "@/components/global-search";
import { ClockWidget } from "@/components/shared/clock-widget";
import { SidebarToggle } from "@/components/shared/sidebar-toggle";

import { cookies } from "next/headers";
// import { BrandSwitcher } from "@/components/shared/brand-switcher";

import { SidebarNav } from "@/components/shared/sidebar-nav";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const activeBrand = cookieStore.get("activeBrand")?.value || "Football Counter";

  const unreadCount = await NotificationService.getUnreadCount(user.id);

  return (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center">
          <SidebarToggle />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">Kodewise</h1>
          <span className="ml-2 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-indigo-800">
            {user.role}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <ClockWidget />
          <NotificationBell initialCount={unreadCount} />

          <div className="text-xs sm:text-sm font-medium text-gray-700 hidden md:block">
            {user.name} ({user.email})
          </div>
          <form action={logOut}>
            <button
              type="submit"
              className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-900 hover:bg-gray-200"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <SidebarNav 
          userRole={user.role} 
          userRoles={user.roles || [user.role]} 
          userCapabilities={user.capabilities || []} 
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
