import { requireAuth } from "@/lib/auth/utils";
import { UserService } from "@/services/UserService";
import { ProfileDraftService } from "@/services/ProfileDraftService";
import { AttendanceCalendar } from "@/components/shared/attendance-calendar";
import { ProfileClient } from "./profile-client";

export default async function EmployeeProfilePage() {
  const authUser = await requireAuth();
  
  const [fullUser, draft] = await Promise.all([
    UserService.getById(authUser.id),
    ProfileDraftService.getDraftByUserId(authUser.id)
  ]);

  if (!fullUser) {
    return <div>User not found</div>;
  }

  const isTl = authUser.role === "TEAM_LEADER";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-heading">My Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your personal credentials, contact details, and attendance calendar.</p>
      </div>

      <ProfileClient user={fullUser} draft={draft} isTl={isTl} />

      <div className="mt-8 border-t pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 font-sans">Attendance Calendar</h3>
        <AttendanceCalendar userId={fullUser.id} />
      </div>
    </div>
  );
}
