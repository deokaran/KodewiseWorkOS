"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Circle, Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markNotificationAsReadAction } from "@/actions/notifications";
import { useState } from "react";
import { NotificationBadge } from "./notification-badge";

export function NotificationList({ notifications, filterUnread }: { notifications: any[], filterUnread: boolean }) {
  const router = useRouter();
  const [marking, setMarking] = useState<Record<string, boolean>>({});

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setMarking(prev => ({ ...prev, [id]: true }));
    await markNotificationAsReadAction(id);
    setMarking(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div>
      <div className="flex border-b">
        <Link 
          href="/notifications" 
          className={`flex-1 text-center py-3 text-sm font-medium ${!filterUnread ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All
        </Link>
        <Link 
          href="/notifications?unread=true" 
          className={`flex-1 text-center py-3 text-sm font-medium ${filterUnread ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Unread
        </Link>
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center px-4">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Inbox className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
          <p className="text-gray-500 max-w-sm">
            {filterUnread 
              ? "You've read all your notifications. Great job staying on top of things!" 
              : "You don't have any notifications yet. They will appear here when there's activity."}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((notification) => {
            const isRead = notification.isRead;
            
            const content = (
              <div className="flex gap-4 items-start p-4 hover:bg-gray-50 transition-colors group">
                <div className="mt-1">
                  <NotificationBadge type={notification.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-medium truncate ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.body}
                  </p>
                </div>
                <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isRead && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                      onClick={(e) => handleMarkRead(e, notification.id)}
                      disabled={marking[notification.id]}
                    >
                      <Circle className="h-5 w-5" />
                    </Button>
                  )}
                  {isRead && (
                    <div className="h-8 w-8 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            );

            if (notification.link) {
              return (
                <Link key={notification.id} href={notification.link} className={`block ${!isRead ? 'bg-indigo-50/30' : ''}`}>
                  {content}
                </Link>
              );
            }

            return (
              <div key={notification.id} className={!isRead ? 'bg-indigo-50/30' : ''}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
