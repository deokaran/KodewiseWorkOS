"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
  Check, 
  X, 
  User, 
  Clock, 
  FileText, 
  Calendar, 
  Mail, 
  Phone, 
  Building2,
  ExternalLink,
  AlertCircle,
  Palmtree
} from "lucide-react";
import { approveProfileDraftAction, rejectProfileDraftAction } from "@/actions/profile";
import { approveAttendanceRequestAction, rejectAttendanceRequestAction } from "@/actions/attendance-requests";
import { approveLeaveAction, rejectLeaveAction } from "@/actions/leaves";

interface ApprovalsClientProps {
  initialDrafts: any[];
  initialAttendanceRequests: any[];
  initialLeaveRequests?: any[];
}

export function ApprovalsClient({ 
  initialDrafts = [], 
  initialAttendanceRequests = [],
  initialLeaveRequests = []
}: ApprovalsClientProps) {
  const router = useRouter();
  // const [activeTab, setActiveTab] = useState("profiles");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const handleProfileApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await approveProfileDraftAction(userId);
      if (!res.success) throw new Error(res.error);
      toast.success("Profile updates approved and updated!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve profile draft");
    } finally {
      setProcessingId(null);
    }
  };

  const handleProfileReject = (userId: string) => {
    setConfirmState({
      open: true,
      title: "Reject Profile Modifications",
      description: "Are you sure you want to reject these profile modifications?",
      onConfirm: async () => {
        setProcessingId(userId);
        try {
          const res = await rejectProfileDraftAction(userId);
          if (!res.success) throw new Error(res.error);
          toast.success("Profile updates rejected and cleared");
          router.refresh();
        } catch (e: any) {
          toast.error(e.message || "Failed to reject profile draft");
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleAttendanceApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await approveAttendanceRequestAction(requestId);
      if (!res.success) throw new Error(res.error);
      toast.success("Attendance modification approved successfully!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve attendance request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAttendanceReject = (requestId: string) => {
    setConfirmState({
      open: true,
      title: "Reject Attendance Request",
      description: "Are you sure you want to reject this attendance request?",
      onConfirm: async () => {
        setProcessingId(requestId);
        try {
          const res = await rejectAttendanceRequestAction(requestId);
          if (!res.success) throw new Error(res.error);
          toast.success("Attendance request rejected");
          router.refresh();
        } catch (e: any) {
          toast.error(e.message || "Failed to reject attendance request");
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleLeaveApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await approveLeaveAction(id);
      if (!res.success) throw new Error(res.error);
      toast.success("Leave request approved successfully!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve leave request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLeaveReject = (id: string) => {
    setConfirmState({
      open: true,
      title: "Reject Leave Request",
      description: "Are you sure you want to reject this leave request?",
      onConfirm: async () => {
        setProcessingId(id);
        try {
          const res = await rejectLeaveAction(id);
          if (!res.success) throw new Error(res.error);
          toast.success("Leave request rejected");
          router.refresh();
        } catch (e: any) {
          toast.error(e.message || "Failed to reject leave request");
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="bg-slate-100 border p-7 rounded-xl w-full overflow-x-auto flex whitespace-nowrap scrollbar-none justify-start sm:w-auto">
          <TabsTrigger value="profiles" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-5">
            Profile Drafts ({initialDrafts.length})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-5">
            Attendance Requests ({initialAttendanceRequests.length})
          </TabsTrigger>
          <TabsTrigger value="leaves" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-5">
            Leave Requests ({initialLeaveRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile drafts list */}
        <TabsContent value="profiles" className="space-y-4 mt-6">
          {initialDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-3xl bg-slate-50 text-center">
              <User className="h-10 w-10 text-slate-300 mb-2" />
              <p className="font-bold text-gray-700">No Pending Profile Drafts</p>
              <p className="text-xs text-gray-500 mt-1">All employee profile modifications have been approved or processed.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {initialDrafts.map((draft) => (
                <Card key={draft.id} className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl">
                  <div className="p-6 bg-slate-50/50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-950 text-lg leading-tight">{draft.user.name}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">{draft.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => handleProfileReject(draft.userId)}
                        disabled={processingId !== null}
                        variant="outline" 
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-xl"
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => handleProfileApprove(draft.userId)}
                        disabled={processingId !== null}
                        className="bg-indigo-600 text-white hover:bg-indigo-750 rounded-xl"
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        Approve
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Proposed Edits</h5>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                      {draft.name && (
                        <div className="border p-3 rounded-xl bg-white space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Full Name</p>
                          <p className="font-semibold text-gray-900">{draft.name}</p>
                          <p className="text-[10px] text-slate-400">Current: {draft.user.name}</p>
                        </div>
                      )}

                      {draft.personalEmail && (
                        <div className="border p-3 rounded-xl bg-white space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Personal Email</p>
                          <p className="font-semibold text-gray-900">{draft.personalEmail}</p>
                          <p className="text-[10px] text-slate-400">Current: {draft.user.personalEmail || "None"}</p>
                        </div>
                      )}

                      {draft.mobileNumber && (
                        <div className="border p-3 rounded-xl bg-white space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mobile Number</p>
                          <p className="font-semibold text-gray-900">{draft.mobileNumber}</p>
                          <p className="text-[10px] text-slate-400">Current: {draft.user.mobileNumber || "None"}</p>
                        </div>
                      )}

                      {draft.dob && (
                        <div className="border p-3 rounded-xl bg-white space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date of Birth</p>
                          <p className="font-semibold text-gray-900">{new Date(draft.dob).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400">
                            Current: {draft.user.dob ? new Date(draft.user.dob).toLocaleDateString() : "None"}
                          </p>
                        </div>
                      )}

                      {draft.aadhaarNumber && (
                        <div className="border p-3 rounded-xl bg-white space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Aadhaar Number</p>
                          <p className="font-semibold text-indigo-900">{draft.aadhaarNumber}</p>
                          <p className="text-[10px] text-slate-400">Current: {draft.user.aadhaarNumber || "None"}</p>
                        </div>
                      )}
                    </div>

                    {/* Image links */}
                    {(draft.photo || draft.aadhaarPhoto) && (
                      <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                        {draft.photo && (
                          <div className="border p-4 rounded-xl bg-white flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full border overflow-hidden flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/api/users/${draft.userId}/draft-photo?t=${new Date(draft.updatedAt).getTime()}`} alt="Draft Preview" className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-700">Proposed Profile Image</p>
                                <p className="text-[9px] text-gray-400 font-medium">Uploaded image file</p>
                              </div>
                            </div>
                            <a 
                              href={`/api/users/${draft.userId}/draft-photo`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 border rounded-lg bg-slate-50 hover:bg-slate-100 transition shadow-sm text-gray-650"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        )}

                        {draft.aadhaarPhoto && (
                          <div className="border p-4 rounded-xl bg-white flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-indigo-500 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-gray-750">Proposed Aadhaar Proof</p>
                                <p className="text-[9px] text-gray-400 font-medium">Click view to open full image</p>
                              </div>
                            </div>
                            <a 
                              href={`/api/users/${draft.userId}/draft-aadhaar`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 border rounded-lg bg-slate-50 hover:bg-slate-100 transition shadow-sm text-gray-650"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Attendance requests list */}
        <TabsContent value="attendance" className="space-y-4 mt-6">
          {initialAttendanceRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-3xl bg-slate-50 text-center">
              <Clock className="h-10 w-10 text-slate-300 mb-2" />
              <p className="font-bold text-gray-700">No Pending Attendance Requests</p>
              <p className="text-xs text-gray-500 mt-1">All employee manual logs checkin/checkout requests have been approved or rejected.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {initialAttendanceRequests.map((req) => (
                <Card key={req.id} className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl">
                  <div className="p-6 bg-slate-50/50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
                        <Clock className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-950 text-base leading-tight">
                          {req.user.name} 
                          <span className="ml-2 font-normal text-xs text-gray-500">({req.user.email})</span>
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                          Requested: {req.type === "CREATE" ? "Manual Log Creation" : "Session Modification"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => handleAttendanceReject(req.id)}
                        disabled={processingId !== null}
                        variant="outline" 
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-xl"
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => handleAttendanceApprove(req.id)}
                        disabled={processingId !== null}
                        className="bg-indigo-600 text-white hover:bg-indigo-755 rounded-xl"
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        Approve
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">
                      <div className="border p-3 rounded-xl bg-white space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(req.clockIn)}</p>
                      </div>

                      <div className="border p-3 rounded-xl bg-white space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Clock In Time</p>
                        <p className="font-semibold text-gray-900">{formatTime(req.clockIn)}</p>
                      </div>

                      <div className="border p-3 rounded-xl bg-white space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Clock Out Time</p>
                        <p className="font-semibold text-gray-900">
                          {req.clockOut ? formatTime(req.clockOut) : <span className="text-gray-450 font-normal italic">Active session</span>}
                        </p>
                      </div>

                      <div className="border p-3 rounded-xl bg-white space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Work Location</p>
                        <Badge 
                          variant="outline"
                          className={req.workLocation === "WORK_FROM_HOME" ? "border-blue-200 text-blue-800 bg-blue-50/50" : "border-emerald-200 text-emerald-800 bg-emerald-50/50"}
                        >
                          {req.workLocation === "WORK_FROM_HOME" ? "Work From Home" : "In Office"}
                        </Badge>
                      </div>

                      {req.attendance && (
                        <div className="border p-3 rounded-xl bg-white space-y-1 col-span-2">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current DB Values</p>
                          <p className="text-xs text-gray-600">
                            Clock In: <strong className="font-semibold">{formatTime(req.attendance.clockIn)}</strong> | 
                            Clock Out: <strong className="font-semibold">{req.attendance.clockOut ? formatTime(req.attendance.clockOut) : "Active"}</strong> | 
                            Loc: <strong className="font-semibold">{req.attendance.workLocation}</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {req.reason && (
                      <div className="flex gap-2 bg-slate-50 border p-3 rounded-xl text-xs text-gray-600">
                        <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-700">Reason for Request:</p>
                          <p className="mt-0.5 italic">&quot;{req.reason}&quot;</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Leave Requests */}
        <TabsContent value="leaves" className="space-y-4 mt-6">
          {initialLeaveRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-3xl bg-slate-50 text-center">
              <Palmtree className="h-10 w-10 text-slate-300 mb-2" />
              <p className="font-bold text-gray-700">No Pending Leave Requests</p>
              <p className="text-xs text-gray-500 mt-1">All employee leave applications have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {initialLeaveRequests.map((req: any) => {
                const days = Math.max(1, Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);

                return (
                  <Card key={req.id} className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border-b px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-750">
                          {req.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-950 leading-none">{req.user.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{req.user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           onClick={() => handleLeaveReject(req.id)}
                           disabled={processingId !== null}
                           className="border-red-200 text-red-750 hover:bg-red-50 rounded-xl"
                         >
                           <X className="h-4 w-4 mr-1" />
                           <span>Reject</span>
                         </Button>
                         <Button 
                           size="sm" 
                           onClick={() => handleLeaveApprove(req.id)}
                           disabled={processingId !== null}
                           className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl"
                         >
                           <Check className="h-4 w-4 mr-1" />
                           <span>Approve</span>
                         </Button>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-xs">
                        <div className="border p-3 rounded-xl bg-white space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Leave Type</p>
                          <Badge variant="outline" className="capitalize font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
                            {req.type.toLowerCase()}
                          </Badge>
                        </div>

                        <div className="border p-3 rounded-xl bg-white space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Duration</p>
                          <p className="font-bold text-gray-900">{days} {days === 1 ? 'day' : 'days'}</p>
                        </div>

                        <div className="border p-3 rounded-xl bg-white space-y-1 col-span-2">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Period</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {req.reason && (
                        <div className="flex gap-2 bg-slate-50 border p-3 rounded-xl text-xs text-gray-600">
                          <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-gray-700">Reason for Request:</p>
                            <p className="mt-0.5">{req.reason}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, open }))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        confirmText="Reject"
        variant="destructive"
      />
    </div>
  );
}
