"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatError } from "@/lib/utils";
import { assignStageToUserAction } from "@/actions/stage-assignment";
import { TaskCreationModal } from "@/components/shared/task-creation-modal";

export function TeamMemberAssignActions({ 
  employee, 
  unassignedStages = [], 
  allBrands = [], 
  allClients = [],
  allWorkTypes = [],
  allProcessTemplates = [],
  allUsers = []
}: { 
  employee: any; 
  unassignedStages: any[]; 
  allBrands: any[]; 
  allClients: any[];
  allWorkTypes: any[];
  allProcessTemplates?: any[];
  allUsers?: any[];
}) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState<"none" | "stage" | "general">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState("");

  const handleAssignStage = async () => {
    if (!selectedStageId) {
      toast.error("Please select a stage to assign");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignStageToUserAction(selectedStageId, employee.id);
      if (!res.success) throw new Error(res.error);

      toast.success(`Stage assigned to ${employee.name}`);
      setActiveDialog("none");
      setSelectedStageId("");
      router.refresh();
    } catch (err: any) {
      toast.error(formatError(err.message) || "Failed to assign stage");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={() => setActiveDialog("stage")}
        className="border-indigo-200 text-indigo-700 bg-indigo-50/30 hover:bg-indigo-50/80"
      >
        ＋ Assign Active Stage
      </Button>
      <Button 
        variant="default" 
        onClick={() => setActiveDialog("general")}
        className="bg-indigo-600 text-white hover:bg-indigo-700"
      >
        ＋ Assign General Task
      </Button>

      {/* 1. Assign Stage Dialog */}
      <Dialog open={activeDialog === "stage"} onOpenChange={(open) => !open && setActiveDialog("none")}>
        <DialogContent className="max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading">Assign Active Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="space-y-1">
              <Label>Select Active Unassigned Stage</Label>
              {unassignedStages.length > 0 ? (
                <Select value={selectedStageId} onValueChange={(val) => setSelectedStageId(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedStages.map((stage: any) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.workItem.workNumber} - {stage.workItem.title} ({stage.stageTemplate.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-gray-500 py-2">No unassigned active stages available in the workspace.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog("none")}>Cancel</Button>
            <Button 
              onClick={handleAssignStage} 
              disabled={isSubmitting || unassignedStages.length === 0} 
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {isSubmitting ? "Assigning..." : "Assign Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Assign General Task Dialog */}
      <TaskCreationModal
        open={activeDialog === "general"}
        onOpenChange={(open) => setActiveDialog(open ? "general" : "none")}
        onSuccess={() => {
          toast.success(`General task created and assigned to ${employee.name}`);
          router.refresh();
        }}
        initialAssigneeId={employee.id}
      />
    </div>
  );
}
