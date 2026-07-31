"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Settings, 
  User, 
  Calendar, 
  History, 
  FileText,
  Code,
  CheckSquare,
  Palmtree,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  userRole: string;
  userRoles?: string[];
  userCapabilities?: string[];
}

// Custom Football SVG Icon
const FootballIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-1.5 5h3L12 2Z" />
    <path d="m12 22-1.5-5h3L12 22Z" />
    <path d="m2 12 5-1.5v3L2 12Z" />
    <path d="m22 12-5-1.5v3l5 1.5Z" />
    <path d="M12 7.5 8.5 10v4l3.5 2.5 3.5-2.5v-4L12 7.5Z" />
  </svg>
);

export function SidebarNav({ userRole, userRoles = [], userCapabilities = [] }: SidebarNavProps) {
  const pathname = usePathname();
  const isTl = userRole === "TEAM_LEADER";
  const hasCollab = userCapabilities.includes("Collaborator");

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Context determinations purely based on paths
  const isFcActive = (isTl || hasCollab) && pathname.includes("/tl/fc");
  const isKwActive = isTl && pathname.includes("/tl/kodewise");
  const showSubSidebar = isFcActive || isKwActive;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={cn(
          "flex h-full flex-shrink-0 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto z-50",
          isOpen ? "fixed inset-y-0 left-0 translate-x-0" : "fixed inset-y-0 left-0 -translate-x-full lg:flex"
        )}
      >
        {/* Sidebar 1: Primary Navigation */}
        <aside className="w-60 border-r border-slate-800 bg-slate-900 p-4 shadow-sm overflow-y-auto flex flex-col justify-between flex-shrink-0 relative">
          {isOpen && (
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-white p-1 rounded-md bg-slate-800 transition"
              title="Close Menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        <div className="space-y-1.5">
          {isTl ? (
            <>
              {/* Combined Dashboard */}
              <Link
                href="/tl"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/tl"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Combined Dashboard</span>
              </Link>

              {/* Football Counter Space Trigger */}
              <Link
                href="/tl/fc"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isFcActive
                    ? "bg-slate-800 text-orange-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-orange-400"
                )}
              >
                <FootballIcon className={cn("h-4 w-4", isFcActive ? "text-orange-400" : "text-orange-500")} />
                <span>Football Counter Space</span>
              </Link>

              {/* Kodewise Space Trigger */}
              <Link
                href="/tl/kodewise"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isKwActive
                    ? "bg-slate-800 text-sky-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-sky-400"
                )}
              >
                <Code className={cn("h-4 w-4", isKwActive ? "text-sky-400" : "text-sky-500")} />
                <span>Kodewise Space</span>
              </Link>

              {/* Team Members */}
              <Link
                href="/tl/team"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/tl/team"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <Users className="h-4 w-4" />
                <span>Team Members</span>
              </Link>

              {/* Approvals Dashboard */}
              <Link
                href="/tl/approvals"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/tl/approvals"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <CheckSquare className="h-4 w-4" />
                <span>Approvals Dashboard</span>
              </Link>

              {/* Work Activity Log */}
              <Link
                href="/tl/log"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/tl/log"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Work Activity Log</span>
              </Link>

              {/* Process Builder */}
              <Link
                href="/tl/processes"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname.includes("/tl/processes")
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                <span>Process Builder</span>
              </Link>

              {/* Settings */}
              <Link
                href="/tl/settings"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname.includes("/tl/settings")
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </>
          ) : (
            <>
              {/* Employee Dashboard */}
              <Link
                href="/employee"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/employee"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>My Dashboard</span>
              </Link>

              <Link
                href="/employee/work"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname.includes("/employee/work")
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                <span>Work</span>
              </Link>

              <Link
                href="/employee/processes"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname.includes("/employee/processes")
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                <span>Process Library</span>
              </Link>

              {hasCollab && (
                <Link
                  href="/tl/fc/collaborations"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isFcActive
                      ? "bg-slate-800 text-orange-400 font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-orange-400"
                  )}
                >
                  <FootballIcon className={cn("h-4 w-4", isFcActive ? "text-orange-400" : "text-orange-500")} />
                  <span>Football Counter Space</span>
                </Link>
              )}
            </>
          )}

          {/* Shared Links */}
          <Link
            href={isTl ? "/tl/profile" : "/employee/profile"}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.includes("/profile")
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
            )}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>

          <Link
            href={isTl ? "/tl/leaves" : "/employee/leaves"}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.includes("/leaves")
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
            )}
          >
            <Palmtree className="h-4 w-4" />
            <span>Leaves</span>
          </Link>

          <Link
            href="/calendar"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === "/calendar"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
            )}
          >
            <Calendar className="h-4 w-4" />
            <span>Calendar</span>
          </Link>

          <Link
            href="/history"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === "/history"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
            )}
          >
            <History className="h-4 w-4" />
            <span>Global History</span>
          </Link>
        </div>
      </aside>

      {/* Sidebar 2: Contextual Sub-Navigation */}
      {showSubSidebar && (
        <aside className="w-52 border-r border-slate-800 bg-slate-800 p-4 overflow-y-auto flex-shrink-0 space-y-4">
          <div className="px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isFcActive ? "FC Operations" : "KW Operations"}
            </span>
          </div>

          <div className="space-y-1">
            {isFcActive ? (
              <>
                {isTl && (
                  <>
                    <Link
                      href="/tl/fc"
                      className={cn(
                        "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                        pathname === "/tl/fc"
                          ? "text-orange-400 bg-slate-700/50"
                          : "text-slate-300 hover:bg-slate-700/30 hover:text-orange-400"
                      )}
                    >
                      FC Dashboard
                    </Link>
                    <Link
                      href="/tl/fc/clients"
                      className={cn(
                        "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                        pathname === "/tl/fc/clients"
                          ? "text-orange-400 bg-slate-700/50"
                          : "text-slate-300 hover:bg-slate-700/30 hover:text-orange-400"
                      )}
                    >
                      Client List
                    </Link>
                  </>
                )}
                <Link
                  href="/tl/fc/collaborations"
                  className={cn(
                    "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                    pathname === "/tl/fc/collaborations"
                      ? "text-orange-400 bg-slate-700/50"
                      : "text-slate-300 hover:bg-slate-700/30 hover:text-orange-400"
                  )}
                >
                  Collaborations
                </Link>
                {isTl && (
                  <>
                    <Link
                      href="/tl/fc/team"
                      className={cn(
                        "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                        pathname === "/tl/fc/team"
                          ? "text-orange-400 bg-slate-700/50"
                          : "text-slate-300 hover:bg-slate-700/30 hover:text-orange-400"
                      )}
                    >
                      FC Team
                    </Link>
                    <Link
                      href="/tl/fc/work"
                      className={cn(
                        "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                        pathname === "/tl/fc/work"
                          ? "text-orange-400 bg-slate-700/50"
                          : "text-slate-300 hover:bg-slate-700/30 hover:text-orange-400"
                      )}
                    >
                      FC Work &amp; Tasks
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/tl/kodewise"
                  className={cn(
                    "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                    pathname === "/tl/kodewise"
                      ? "text-sky-400 bg-slate-700/50"
                      : "text-slate-300 hover:bg-slate-700/30 hover:text-sky-400"
                  )}
                >
                  KW Dashboard
                </Link>
                <Link
                  href="/tl/kodewise/clients"
                  className={cn(
                    "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                    pathname === "/tl/kodewise/clients"
                      ? "text-sky-400 bg-slate-700/50"
                      : "text-slate-300 hover:bg-slate-700/30 hover:text-sky-400"
                  )}
                >
                  Client List
                </Link>
                <Link
                  href="/tl/kodewise/team"
                  className={cn(
                    "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                    pathname === "/tl/kodewise/team"
                      ? "text-sky-400 bg-slate-700/50"
                      : "text-slate-300 hover:bg-slate-700/30 hover:text-sky-400"
                  )}
                >
                  KW Team
                </Link>
                <Link
                  href="/tl/kodewise/work"
                  className={cn(
                    "block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                    pathname === "/tl/kodewise/work"
                      ? "text-sky-400 bg-slate-700/50"
                      : "text-slate-300 hover:bg-slate-700/30 hover:text-sky-400"
                  )}
                >
                  KW Work &amp; Tasks
                </Link>
              </>
            )}
          </div>
        </aside>
      )}
      </div>
    </>
  );
}
