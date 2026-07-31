import { AlertCircle, CheckCircle, ClipboardList, Clock, FileEdit, UserPlus, FileWarning, Inbox } from "lucide-react";

export function NotificationBadge({ type }: { type: string }) {
  let icon = <Inbox className="h-4 w-4" />;
  let colorClass = "bg-gray-100 text-gray-600";

  switch (type) {
    case "ASSIGNMENT":
      icon = <UserPlus className="h-4 w-4" />;
      colorClass = "bg-blue-100 text-blue-600";
      break;
    case "STAGE_READY":
      icon = <ClipboardList className="h-4 w-4" />;
      colorClass = "bg-indigo-100 text-indigo-600";
      break;
    case "APPROVAL_REQUIRED":
      icon = <FileEdit className="h-4 w-4" />;
      colorClass = "bg-amber-100 text-amber-600";
      break;
    case "TL_APPROVED":
    case "CLIENT_ACCEPTED_BY_TL":
      icon = <CheckCircle className="h-4 w-4" />;
      colorClass = "bg-green-100 text-green-600";
      break;
    case "TL_REJECTED":
    case "REVISION_REQUESTED":
      icon = <FileWarning className="h-4 w-4" />;
      colorClass = "bg-red-100 text-red-600";
      break;
    case "DEADLINE_REMINDER":
    case "OVERDUE":
      icon = <Clock className="h-4 w-4" />;
      colorClass = "bg-orange-100 text-orange-600";
      break;
  }

  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorClass}`}>
      {icon}
    </div>
  );
}
