import { requireAuth } from "@/lib/auth/utils";
import { NotificationService } from "@/services/NotificationService";
import { NotificationList } from "./notification-list";
import { MarkAllReadButton } from "./mark-all-read-button";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ unread?: string }> }) {
  const user = await requireAuth();
  const params = await searchParams;
  const filterUnread = params.unread === "true";
  
  const notifications = await NotificationService.getUserNotifications(user.id, filterUnread);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated on your work items and tasks.</p>
        </div>
        <MarkAllReadButton />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <NotificationList notifications={notifications} filterUnread={filterUnread} />
      </div>
    </div>
  );
}
