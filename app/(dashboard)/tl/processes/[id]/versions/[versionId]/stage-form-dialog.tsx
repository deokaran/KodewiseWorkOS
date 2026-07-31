"use client";

import { useState } from "react";
import { Capability } from "@prisma/client";
import { createProcessStageAction, updateProcessStageAction } from "@/actions/process-stages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface StageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
  versionId: string;
  capabilities: Capability[];
  initialData?: any;
  insertIndex?: number;
}

export function StageFormDialog({ 
  open, 
  onOpenChange, 
  processId, 
  versionId, 
  capabilities, 
  initialData,
  insertIndex
}: StageFormDialogProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    capabilityId: initialData?.capabilityId || "none",
    estimatedDurationMins: initialData?.estimatedDurationMins?.toString() || "60",
    instructions: initialData?.instructions || "",
    requiresTLApproval: initialData?.requiresTLApproval || false,
    requiresManualClientAcceptance: initialData?.requiresManualClientAcceptance || false,
    isDefaultOpenPool: initialData?.isDefaultOpenPool || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        versionId,
        name: formData.name,
        capabilityId: formData.capabilityId === "none" ? undefined : formData.capabilityId,
        estimatedDurationMins: parseInt(formData.estimatedDurationMins, 10) || 0,
        instructions: formData.instructions || undefined,
        requiresTLApproval: formData.requiresTLApproval,
        requiresManualClientAcceptance: formData.requiresManualClientAcceptance,
        isDefaultOpenPool: false,
        order: insertIndex,
      };

      if (initialData) {
        const res = await updateProcessStageAction({ id: initialData.id, ...payload }, processId, versionId);
        if (!res.success) throw new Error(res.error);
        toast.success("Stage updated successfully");
      } else {
        const res = await createProcessStageAction(payload, processId, versionId);
        if (!res.success) throw new Error(res.error);
        toast.success("Stage created successfully");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save stage");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Stage' : 'Add Stage'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Stage Name *</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Graphic Design" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Required Capability</Label>
              <Select 
                value={formData.capabilityId} 
                onValueChange={(val) => setFormData({...formData, capabilityId: val})}
                items={[{ value: "none", label: "None (Any Employee)" }, ...(capabilities || []).map(cap => ({ value: cap.id, label: cap.name }))]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select capability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Any Employee)</SelectItem>
                  {capabilities.map(cap => (
                    <SelectItem key={cap.id} value={cap.id}>{cap.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estimated Duration (mins) *</Label>
              <Input type="number" min="0" value={formData.estimatedDurationMins} onChange={e => setFormData({...formData, estimatedDurationMins: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea 
              value={formData.instructions} 
              onChange={e => setFormData({...formData, instructions: e.target.value})} 
              placeholder="Guidelines for the employee completing this stage..."
              rows={3}
            />
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-medium text-gray-900 border-b pb-2">Settings</h4>
            
            <label className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md">
              <input 
                type="checkbox"
                checked={formData.requiresTLApproval}
                onChange={e => setFormData({...formData, requiresTLApproval: e.target.checked})}
                className="mt-1 rounded border-gray-300"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900">Requires TL Approval</span>
                <span className="block text-xs text-gray-500">Stage cannot complete until Team Leader approves it.</span>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md">
              <input 
                type="checkbox"
                checked={formData.requiresManualClientAcceptance}
                onChange={e => setFormData({...formData, requiresManualClientAcceptance: e.target.checked})}
                className="mt-1 rounded border-gray-300"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900">Requires Client Acceptance</span>
                <span className="block text-xs text-gray-500">Client must approve deliverables before proceeding.</span>
              </div>
            </label>

          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Stage'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
