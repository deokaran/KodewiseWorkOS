"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startStageAction, submitStageAction, approveStageAction, rejectStageAction, markClientAcceptedAction, skipStageAction, cancelStageAction } from "@/actions/stage-execution";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function StageActionButtons({ stage, workItemId, userRole, userId }: { stage: any, workItemId: string, userRole: string, userId?: string }) {
  const [loading, setLoading] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    setLoading(true);
    try {
      const res = await action();
      if (!res.success) throw new Error(res.error);
      toast.success(successMsg);
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => handleAction(() => startStageAction(stage.id, workItemId), "Stage started");
  const handleSubmit = () => handleAction(() => submitStageAction(stage.id, workItemId), "Stage submitted");
  const handleApprove = () => handleAction(() => approveStageAction(stage.id, workItemId), "Stage approved");
  
  const handleRejectClick = () => {
    setRejectReason("");
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setIsRejectOpen(false);
    await handleAction(() => rejectStageAction(stage.id, workItemId, rejectReason.trim()), "Stage rejected");
  };

  const handleClientAccepted = () => handleAction(() => markClientAcceptedAction(stage.id, workItemId), "Client accepted");
  const handleSkip = () => handleAction(() => skipStageAction(stage.id, workItemId), "Stage skipped");
  const handleCancel = () => handleAction(() => cancelStageAction(stage.id, workItemId), "Stage cancelled");

  const canStart = userRole === "TEAM_LEADER" || !stage.assignedUserId || stage.assignedUserId === userId;
  const canSubmit = userRole === "TEAM_LEADER" || stage.assignedUserId === userId;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {(stage.status === "READY" || stage.status === "REJECTED") && canStart && (
        <Button size="sm" onClick={handleStart} disabled={loading}>
          Start
        </Button>
      )}

      {stage.status === "IN_PROGRESS" && canSubmit && (
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          Submit
        </Button>
      )}

      {stage.status === "SUBMITTED" && userRole === "TEAM_LEADER" && stage.stageTemplate.requiresTLApproval && (
        <>
          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={loading}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={handleRejectClick} disabled={loading}>
            Reject
          </Button>
        </>
      )}
      
      {(stage.status === "SUBMITTED" || stage.status === "COMPLETED") && userRole === "TEAM_LEADER" && stage.stageTemplate.requiresManualClientAcceptance && stage.status !== "COMPLETED" && (
        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleClientAccepted} disabled={loading}>
          Mark Client Accepted
        </Button>
      )}

      {userRole === "TEAM_LEADER" && (stage.status !== "COMPLETED" && stage.status !== "CANCELLED" && stage.status !== "SKIPPED") && (
        <>
          <Button size="sm" variant="outline" onClick={handleSkip} disabled={loading}>
            Skip
          </Button>
          <Button size="sm" variant="destructive" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
        </>
      )}

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-[400px]">
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-gray-900 font-heading">Reject Stage</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Please provide a reason for rejecting this stage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason" className="text-gray-700 font-semibold">Reason</Label>
              <Input
                id="reject-reason"
                placeholder="e.g. Assets are missing or incorrect resolution"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" size="sm" disabled={loading}>
                Reject Stage
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
