"use client";

import { useState, useEffect } from "react";
import { createWorkItemAction, updateWorkItemAction } from "@/actions/work-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatError } from "@/lib/utils";

export function WorkFormDialog({ 
  open, 
  onOpenChange, 
  initialData, 
  defaultDate, 
  tags, 
  clients, 
  workTypes, 
  processes, 
  employees = [],
  defaultAssigneeId,
  defaultProcessTemplateId,
  currentUser,
  prefilledEmployeeId
}: any) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    type: initialData?.type || "CLIENT_DELIVERABLE",
    priority: initialData?.priority || "MEDIUM",
    primaryBrandTagId: initialData?.primaryBrandTagId || "none",
    clientId: initialData?.clientId || "none",
    workTypeId: initialData?.workTypeId || "none",
    processTemplateId: initialData?.processVersion?.templateId || defaultProcessTemplateId || "none",
    description: initialData?.description || "",
    tags: initialData?.tags?.map((t: any) => t.tagId) || [],
    estimatedEnd: "",
    assigneeId: initialData?.stages?.[0]?.assignedUserId || defaultAssigneeId || "none",
  });

  const [stageAssignments, setStageAssignments] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      const activeProcessId = initialData?.processVersion?.templateId || defaultProcessTemplateId || processes?.find((p: any) => p.name === "General Task (No Process)")?.id || "none";
      const activeAssigneeId = initialData?.stages?.[0]?.assignedUserId || defaultAssigneeId || "none";

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: initialData?.title || "",
        type: initialData?.type || "CLIENT_DELIVERABLE",
        priority: initialData?.priority || "MEDIUM",
        primaryBrandTagId: initialData?.primaryBrandTagId || "none",
        clientId: initialData?.clientId || "none",
        workTypeId: initialData?.workTypeId || "none",
        processTemplateId: activeProcessId,
        description: initialData?.description || "",
        tags: initialData?.tags?.map((t: any) => t.tagId) || [],
        estimatedEnd: initialData?.estimatedEnd
          ? new Date(initialData.estimatedEnd).toISOString().split("T")[0]
          : defaultDate
            ? new Date(defaultDate).toISOString().split("T")[0]
            : "",
        assigneeId: activeAssigneeId,
      });

      // Prefill stage assignment to the employee being assigned work, if available
      const targetStageAssignUserId = prefilledEmployeeId || (activeAssigneeId !== "none" ? activeAssigneeId : null);
      if (targetStageAssignUserId && activeProcessId !== "none") {
        const process = processes?.find((p: any) => p.id === activeProcessId);
        const version = process?.versions?.find((v: any) => v.isPublished) || process?.versions?.[0];
        const firstStage = version?.stages?.[0];
        if (firstStage) {
          setStageAssignments({ [firstStage.id]: targetStageAssignUserId });
        } else {
          setStageAssignments({});
        }
      } else {
        setStageAssignments({});
      }
    }
  }, [open, defaultDate, initialData, defaultAssigneeId, defaultProcessTemplateId, processes, prefilledEmployeeId]);

  const handleBrandChange = (brandId: string) => {
    setFormData(prev => {
      const nextClients = brandId !== "none"
        ? clients.filter((c: any) => c.tags.some((t: any) => t.tagId === brandId))
        : clients;
      const isCurrentClientValid = nextClients.some((c: any) => c.id === prev.clientId);
      return {
        ...prev,
        primaryBrandTagId: brandId,
        clientId: isCurrentClientValid ? prev.clientId : "none"
      };
    });
  };

  const handleProcessChange = (val: string | null) => {
    const value = val || "none";
    setFormData(prev => {
      const nextData = { ...prev, processTemplateId: value };
      if (value && value !== "none") {
        const process = processes.find((p: any) => p.id === value);
        if (process) {
          const procName = process.name.toLowerCase();
          const matchedWt = workTypes.find((wt: any) => {
            const wtName = wt.name.toLowerCase();
            return procName.includes(wtName) || wtName.includes(procName) ||
              (procName.includes("reel") && wtName.includes("reel")) ||
              (procName.includes("post") && wtName.includes("post")) ||
              (procName.includes("shoot") && wtName.includes("shoot"));
          });
          if (matchedWt) {
            nextData.workTypeId = matchedWt.id;
          }
        }
      }
      return nextData;
    });

    if (prefilledEmployeeId && value !== "none") {
      const process = processes.find((p: any) => p.id === value);
      const version = process?.versions?.find((v: any) => v.isPublished) || process?.versions?.[0];
      const firstStage = version?.stages?.[0];
      if (firstStage) {
        setStageAssignments({ [firstStage.id]: prefilledEmployeeId });
      } else {
        setStageAssignments({});
      }
    } else {
      setStageAssignments({});
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,
        primaryBrandTagId: formData.primaryBrandTagId === "none" ? undefined : formData.primaryBrandTagId,
        clientId: formData.clientId === "none" ? null : formData.clientId,
        workTypeId: formData.workTypeId === "none" ? null : formData.workTypeId,
        processTemplateId: formData.processTemplateId === "none" ? undefined : formData.processTemplateId,
        stageAssignments: stageAssignments,
        estimatedEnd: formData.estimatedEnd ? new Date(formData.estimatedEnd) : null,
        assigneeId: formData.assigneeId === "none" ? null : formData.assigneeId,
      };
      
      if (initialData) {
        const res = await updateWorkItemAction({ id: initialData.id, ...payload });
        if (!res.success) throw new Error(res.error);
        toast.success("Work item updated successfully");
        onOpenChange(false);
      } else {
        const res = await createWorkItemAction(payload);
        if (!res.success) throw new Error(res.error);
        toast.success("Work item created successfully");
        onOpenChange(false);
        router.push(`/tl/work/${res.data.id}`);
      }
    } catch (e: any) {
      toast.error(formatError(e.message) || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = !!initialData;

  const brandTags = tags.filter((t: any) => t.type === "BRAND");
  const filteredClients = formData.primaryBrandTagId !== "none"
    ? clients.filter((c: any) => c.tags.some((t: any) => t.tagId === formData.primaryBrandTagId))
    : clients;
  const otherTags = tags.filter((t: any) => t.type !== "BRAND");

  const selectedProcess = processes.find((p: any) => p.id === formData.processTemplateId);
  const activeVersion = selectedProcess?.versions.find((v: any) => v.isPublished) || selectedProcess?.versions[0];
  const processStages = activeVersion?.stages || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Work Item' : 'Create Work Item'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. IG Reels Batch 1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <>
                <div className="space-y-2">
                  <Label>Process Template *</Label>
                  <Select 
                    key={`process-${formData.processTemplateId}-${processes?.length || 0}`}
                    value={formData.processTemplateId} 
                    onValueChange={handleProcessChange}
                    items={[{ value: "none", label: "Select..." }, ...(processes || []).map((p: any) => ({ value: p.id, label: p.name }))]}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select process" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select...</SelectItem>
                      {processes?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Primary Brand *</Label>
                  <Select 
                    key={`brand-${formData.primaryBrandTagId}-${brandTags?.length || 0}`}
                    value={formData.primaryBrandTagId} 
                    onValueChange={handleBrandChange}
                    items={[{ value: "none", label: "Select..." }, ...(brandTags || []).map((t: any) => ({ value: t.id, label: t.name }))]}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select...</SelectItem>
                      {brandTags.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Client (Optional)</Label>
              <Select 
                key={`client-${formData.clientId}-${filteredClients?.length || 0}`}
                value={formData.clientId} 
                onValueChange={(val) => setFormData({...formData, clientId: val})}
                items={[{ value: "none", label: "None" }, ...(filteredClients || []).map((c: any) => ({ value: c.id, label: c.name }))]}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredClients?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Work Type (Optional)</Label>
              <Select 
                key={`worktype-${formData.workTypeId}-${workTypes?.length || 0}`}
                value={formData.workTypeId} 
                onValueChange={(val) => setFormData({...formData, workTypeId: val})}
                items={[{ value: "none", label: "None" }, ...(workTypes || []).map((w: any) => ({ value: w.id, label: w.name }))]}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workTypes?.map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(val) => setFormData({...formData, priority: val})}
                items={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "CRITICAL", label: "Critical" }
                ]}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData({...formData, type: val})}
                  items={[
                    { value: "CLIENT_DELIVERABLE", label: "Client Deliverable" },
                    { value: "INTERNAL_EVENT", label: "Internal Event" }
                  ]}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT_DELIVERABLE">Client Deliverable</SelectItem>
                    <SelectItem value="INTERNAL_EVENT">Internal Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isEdit && (formData.processTemplateId === "none" || !formData.processTemplateId) && (
              <div className="space-y-2">
                <Label>Assignee (Optional)</Label>
                <Select 
                  key={`assignee-${formData.assigneeId}-${employees?.length || 0}-${currentUser?.id}`}
                  value={formData.assigneeId} 
                  onValueChange={(val) => setFormData({...formData, assigneeId: val})}
                  items={[
                    { value: "none", label: "Unassigned / Open Pool" },
                    ...(currentUser ? [{ value: currentUser.id, label: `${currentUser.name} (You)` }] : []),
                    ...(employees || []).filter((e: any) => e.id !== currentUser?.id).map((e: any) => ({ value: e.id, label: e.name }))
                  ]}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned / Open Pool</SelectItem>
                    {currentUser && (
                      <SelectItem value={currentUser.id}>{currentUser.name} (You)</SelectItem>
                    )}
                    {employees?.filter((e: any) => e.id !== currentUser?.id).map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Estimated End Date (Deadline)</Label>
            <Input 
              type="date" 
              value={formData.estimatedEnd} 
              onChange={e => setFormData({...formData, estimatedEnd: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Brief description..."
              rows={3}
            />
          </div>

          {processStages.length > 0 && !isEdit && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-gray-900 text-sm">Assign Process Stages to Employees</h4>
              <div className="grid grid-cols-2 gap-4">
                {processStages.map((stage: any) => {
                  // Filter employees by capability if stage requires capability
                  const eligibleEmployees = stage.capabilityId 
                    ? employees.filter((e: any) => e.capabilities.some((c: any) => c.id === stage.capabilityId))
                    : employees;

                  return (
                    <div key={stage.id} className="space-y-2">
                      <Label className="text-xs text-gray-600 block">{stage.name} {stage.capability?.name ? `(${stage.capability.name})` : ""}</Label>
                      <Select 
                        key={`stage-${stage.id}-${stageAssignments[stage.id] || "none"}-${eligibleEmployees.length}`}
                        value={stageAssignments[stage.id] || "none"} 
                        onValueChange={(val) => setStageAssignments(prev => ({ ...prev, [stage.id]: val || "none" }))}
                        items={[
                          { value: "none", label: stage.isDefaultOpenPool ? "Default (Open Pool)" : "Unassigned" },
                          ...eligibleEmployees.map((e: any) => ({ value: e.id, label: e.name }))
                        ]}
                      >
                        <SelectTrigger className="w-full h-8 bg-gray-50 border-gray-200 text-gray-700">
                          <SelectValue placeholder="Select employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{stage.isDefaultOpenPool ? "Default (Open Pool)" : "Unassigned"}</SelectItem>
                          {eligibleEmployees.map((e: any) => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Work Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
