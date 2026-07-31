"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createWorkItemAction, getTaskCreationMasterDataAction } from "@/actions/work-items";

interface TaskCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (workItem: any) => void;
  // Pre-fill parameters
  initialAssigneeId?: string;
  initialClientId?: string;
  initialBrandId?: string;
  defaultDate?: string;
}

export function TaskCreationModal({
  open,
  onOpenChange,
  onSuccess,
  initialAssigneeId = "",
  initialClientId = "", 
  initialBrandId = "",
  defaultDate = "",
}: TaskCreationModalProps) {
  // Master lists fetched dynamically
  const [brands, setBrands] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [processTemplates, setProcessTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // console.log(clients);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface FormDataType {
    title: string;
    description: string;
    primaryBrandTagId: string;
    clientId: string;
    workTypeId: string;
    processTemplateId: string;
    priority: string;
    assigneeId: string;
    targetDate: string;
  }

  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    primaryBrandTagId: initialBrandId || "",
    clientId: initialClientId || "",
    workTypeId: "",
    processTemplateId: "none",
    priority: "MEDIUM",
    assigneeId: initialAssigneeId || "",
    targetDate: defaultDate || "",
  });

  const [stageAssignments, setStageAssignments] = useState<Record<string, string>>({});

  // Fetch master data on open
  useEffect(() => {
    async function loadData() {
      if (!open) return;
      setIsLoadingData(true);
      try {
        const res = await getTaskCreationMasterDataAction();
        if (res.success && res.data) {
          const { brands, clients, workTypes, processTemplates, users, currentUser } = res.data;
          setBrands(brands);
          setClients(clients.filter((c: any) => c.isActive !== false));
          setWorkTypes(workTypes);
          setProcessTemplates(processTemplates);
          setUsers(users);
          setCurrentUser(currentUser);

          // Find general template
          const generalTemplate = processTemplates.find((p: any) => p.name === "General Task (No Process)");
          const defaultProcessId = generalTemplate?.id || "none";

          // Determine initial values
          const activeClientId = initialClientId || "";
          const activeBrandId = initialBrandId || (brands[0]?.id || "");
          const activeAssigneeId = initialAssigneeId || currentUser?.id || "";

          setFormData({
            title: "",
            description: "",
            primaryBrandTagId: activeBrandId,
            clientId: activeClientId,
            workTypeId: (workTypes[0]?.id || "") as string,
            processTemplateId: defaultProcessId,
            priority: "MEDIUM",
            assigneeId: activeAssigneeId || "",
            targetDate: defaultDate || "",
          });

          // Prefill first stage assignment
          if (activeAssigneeId && defaultProcessId !== "none") {
            const process = processTemplates.find((p: any) => p.id === defaultProcessId);
            const activeVersion = process?.versions?.find((v: any) => v.isPublished) || process?.versions?.[0];
            const firstStage = activeVersion?.stages?.[0];
            if (firstStage) {
              setStageAssignments({ [firstStage.id]: activeAssigneeId });
            }
          }
        } else {
          toast.error(res.error || "Failed to load task creation master lists");
        }
      } catch (err: any) {
        toast.error("Failed to load options data");
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, [open, initialBrandId, initialClientId, initialAssigneeId, defaultDate]);

  // When client changes, auto-link primaryBrandTagId based on client's tag
  const handleClientChange = (val: string) => {
    const selectedClient = clients.find((c) => c.id === val);
    const matchedBrandTag = selectedClient?.tags?.find((t: any) => t.tag?.type === "BRAND");
    setFormData((prev) => ({
      ...prev,
      clientId: val,
      primaryBrandTagId: (matchedBrandTag?.tagId || prev.primaryBrandTagId) as string,
    }));
  };

  const handleBrandChange = (val: string | null) => {
    const newBrandId = !val || val === "none" ? "" : val;
    setFormData((prev) => {
      const isClientValid = prev.clientId && clients.some((c: any) => c.id === prev.clientId && c.tags?.some((t: any) => t.tagId === newBrandId || t.tag?.id === newBrandId));
      return {
        ...prev,
        primaryBrandTagId: newBrandId,
        clientId: isClientValid ? prev.clientId : "",
      };
    });
  };

  const handleProcessChange = (val: string | null) => {
    const value = val || "none";
    setFormData((prev) => {
      const nextData = { ...prev, processTemplateId: value };
      if (value && value !== "none") {
        const process = processTemplates.find((p: any) => p.id === value);
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
            nextData.workTypeId = (matchedWt.id || "") as string;
          }
        }
      }
      return nextData;
    });
    setStageAssignments({});
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!formData.primaryBrandTagId) {
      toast.error("Please select a brand");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.processTemplateId === "none" ? "INTERNAL_EVENT" : "CLIENT_DELIVERABLE",
        priority: formData.priority,
        primaryBrandTagId: formData.primaryBrandTagId,
        clientId: formData.clientId === "none" || !formData.clientId ? undefined : formData.clientId,
        workTypeId: formData.workTypeId === "none" || !formData.workTypeId ? undefined : formData.workTypeId,
        processTemplateId: formData.processTemplateId === "none" ? null : formData.processTemplateId,
        assigneeId: formData.assigneeId === "unassigned" || !formData.assigneeId ? undefined : formData.assigneeId,
        estimatedEnd: formData.targetDate ? new Date(formData.targetDate) : null,
        stageAssignments: formData.processTemplateId !== "none" ? stageAssignments : undefined,
      };

      const res = await createWorkItemAction(payload);
      if (!res.success) throw new Error(res.error);

      toast.success("Task spawned successfully");
      onOpenChange(false);
      if (onSuccess) onSuccess(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };
  const selectedProcess = processTemplates.find((p) => p.id === formData.processTemplateId);
  const activeVersion = selectedProcess?.versions?.find((v: any) => v.isPublished) || selectedProcess?.versions?.[0];
  const processStages = activeVersion?.stages || [];

  const filteredClients = formData.primaryBrandTagId && formData.primaryBrandTagId !== "none"
    ? clients.filter((c: any) => c.tags?.some((t: any) => t.tagId === formData.primaryBrandTagId || t.tag?.id === formData.primaryBrandTagId))
    : clients;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[35vw] max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-heading">Create Task</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Create a task or a process run in the system database.
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading task configuration...</span>
          </div>
        ) : (
          <div className="space-y-4 py-4 text-sm">
            <div className="space-y-1">
              <Label>Task Title *</Label>
              <Input
                placeholder="e.g. Update retainer reel designs"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                placeholder="Provide guidelines or task details..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Brand Tag *</Label>
                <Select
                  key={`task-brand-${formData.primaryBrandTagId}-${brands.length}`}
                  value={formData.primaryBrandTagId || "none"}
                  onValueChange={handleBrandChange}
                  items={brands.map((b) => ({ value: b.id, label: b.name }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Client</Label>
                <Select
                  key={`task-client-${formData.primaryBrandTagId}-${formData.clientId}-${filteredClients.length}`}
                  value={formData.clientId || "none"}
                  onValueChange={(val) => handleClientChange(val === "none" || !val ? "" : val)}
                  items={[
                    { value: "none", label: "None (Global)" },
                    ...filteredClients.map((c) => ({ value: c.id, label: c.name }))
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Global)</SelectItem>
                    {filteredClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Process Template</Label>
                <Select
                  key={`task-proc-${formData.processTemplateId}-${processTemplates.length}`}
                  value={formData.processTemplateId || "none"}
                  onValueChange={handleProcessChange}
                  items={[
                    { value: "none", label: "No Process Template" },
                    ...processTemplates.map((p) => ({ value: p.id, label: p.name }))
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Process Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Process Template</SelectItem>
                    {processTemplates.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Task Type / Work Type</Label>
                <Select
                  key={`task-wt-${formData.workTypeId}-${workTypes.length}`}
                  value={formData.workTypeId || "none"}
                  onValueChange={(val) => setFormData({ ...formData, workTypeId: val === "none" || !val ? "" : val })}
                  items={[
                    { value: "none", label: "None" },
                    ...workTypes.map((wt) => ({ value: wt.id, label: wt.name }))
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {workTypes.map((wt) => (
                      <SelectItem key={wt.id} value={wt.id}>
                        {wt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Assignee</Label>
                <Select
                  key={`task-user-${formData.assigneeId}-${users.length}`}
                  value={formData.assigneeId || "unassigned"}
                  onValueChange={(val) => setFormData({ ...formData, assigneeId: val === "unassigned" || !val ? "" : val })}
                  items={[
                    { value: "unassigned", label: "Unassigned (Shared Pool)" },
                    ...users.map((u) => ({
                      value: u.id,
                      label: `${u.name} (${u.role === "TEAM_LEADER" ? "Team Leader" : "Employee"})`
                    }))
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assignee (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned (Shared Pool)</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.role === "TEAM_LEADER" ? "Team Leader" : "Employee"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Priority</Label>
                <Select
                  key={`task-prio-${formData.priority}`}
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val || "MEDIUM" })}
                  items={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" },
                    { value: "CRITICAL", label: "Critical" }
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Deadline (Optional)</Label>
              <Input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>

            {processStages.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm">Assign Process Stages to Employees</h4>
                <div className="grid grid-cols-2 gap-4">
                  {processStages.map((stage: any) => {
                    const eligibleEmployees = stage.capabilityId
                      ? users.filter((u: any) => u.capabilities?.some((c: any) => c.id === stage.capabilityId))
                      : users;

                    return (
                      <div key={stage.id} className="space-y-2">
                        <Label className="text-xs text-gray-600 block">
                          {stage.name} {stage.capability?.name ? `(${stage.capability.name})` : ""}
                        </Label>
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
                            <SelectItem value="none">
                              {stage.isDefaultOpenPool ? "Default (Open Pool)" : "Unassigned"}
                            </SelectItem>
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
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isLoadingData}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingData}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
