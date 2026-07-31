import { requireAuth } from "@/lib/auth/utils";
import { UserService } from "@/services/UserService";
import { LeaveRequestService } from "@/services/LeaveRequestService";
import { LeavesClient } from "./leaves-client";

export default async function EmployeeLeavesPage() {
  const authUser = await requireAuth();

  const [user, leaveRequests] = await Promise.all([
    UserService.getById(authUser.id),
    LeaveRequestService.getUserLeaveRequests(authUser.id)
  ]);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-heading">My Leaves</h2>
        <p className="text-sm text-gray-500 mt-1">
          Apply for leaves, track approval progress, and view your remaining balance and discipline rewards.
        </p>
      </div>

      <LeavesClient user={user} leaveRequests={leaveRequests} />
    </div>
  );
}
