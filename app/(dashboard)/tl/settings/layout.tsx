import { requireRole } from "@/lib/auth/utils";
import Link from "next/link";
import { ReactNode } from "react";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireRole("TEAM_LEADER");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">
          Manage your team, tags, capabilities, and system configuration.
        </p>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <Link href="/tl/settings/team" className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[active=true]:border-indigo-600 data-[active=true]:text-indigo-600">
          Team
        </Link>
        <Link href="/tl/settings/departments" className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[active=true]:border-indigo-600 data-[active=true]:text-indigo-600">
          Departments
        </Link>
        <Link href="/tl/settings/capabilities" className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[active=true]:border-indigo-600 data-[active=true]:text-indigo-600">
          Capabilities
        </Link>
        <Link href="/tl/settings/tags" className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[active=true]:border-indigo-600 data-[active=true]:text-indigo-600">
          Tags
        </Link>
        <Link href="/tl/settings/work-types" className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[active=true]:border-indigo-600 data-[active=true]:text-indigo-600">
          Work Types
        </Link>
        <Link href="/tl/settings/event-types" className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[active=true]:border-indigo-600 data-[active=true]:text-indigo-600">
          Event Types
        </Link>
      </div>

      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
