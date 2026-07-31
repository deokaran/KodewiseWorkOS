"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export function NotificationBell({ initialCount }: { initialCount: number }) {
  // We can pass the initial count from the server component
  // In a real app we might use SWR or websockets to update this,
  // but for now we'll just rely on the server rendering and revalidations.

  return (
    <Link href="/notifications" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
      <Bell className="h-5 w-5 text-gray-600" />
      {initialCount > 0 && (
        <Badge 
          className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-600 border-2 border-white"
        >
          {initialCount > 99 ? '99+' : initialCount}
        </Badge>
      )}
    </Link>
  );
}
