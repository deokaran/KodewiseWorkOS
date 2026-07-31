"use client";

import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsAsReadAction } from "@/actions/notifications";
import { useState } from "react";

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);

  const handleMarkAllRead = async () => {
    setLoading(true);
    await markAllNotificationsAsReadAction();
    setLoading(false);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleMarkAllRead} 
      disabled={loading}
      className="text-gray-600"
    >
      <CheckCheck className="h-4 w-4 mr-2" />
      {loading ? "Marking..." : "Mark all as read"}
    </Button>
  );
}
