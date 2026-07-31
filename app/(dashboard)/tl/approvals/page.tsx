import { requireRole } from "@/lib/auth/utils";
import { ProfileDraftService } from "@/services/ProfileDraftService";
import { AttendanceRequestService } from "@/services/AttendanceRequestService";
import { LeaveRequestService } from "@/services/LeaveRequestService";
import { ApprovalsClient } from "./approvals-client";

export default async function ApprovalsPage() {
  await requireRole("TEAM_LEADER");

  const [pendingDrafts, pendingAttendance, pendingLeaves] = await Promise.all([
    ProfileDraftService.listPendingDrafts(),
    AttendanceRequestService.listPendingRequests(),
    LeaveRequestService.listPendingLeaveRequests()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-heading">Approvals Workspace</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review pending employee profile drafts, manual attendance history logs, and leave requests.
        </p>
      </div>

      <ApprovalsClient 
        initialDrafts={pendingDrafts} 
        initialAttendanceRequests={pendingAttendance} 
        initialLeaveRequests={pendingLeaves}
      />
    </div>
  );
}
