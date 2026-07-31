"use client";

import { Menu } from "lucide-react";

export function SidebarToggle() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
      className="lg:hidden p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 mr-2 flex items-center justify-center flex-shrink-0"
      title="Toggle Sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
