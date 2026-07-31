"use client";

import { useState } from "react";
import { ProcessStageTemplate, Capability } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Plus, Edit2, Trash2 } from "lucide-react";
import { reorderProcessStagesAction, deleteProcessStageAction } from "@/actions/process-stages";
import { StageFormDialog } from "./stage-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type StageWithCapability = ProcessStageTemplate & { capability: Capability | null };

export function StageBuilder({ 
  processId, 
  versionId, 
  stages, 
  capabilities,
  isReadOnly 
}: { 
  processId: string;
  versionId: string;
  stages: StageWithCapability[];
  capabilities: Capability[];
  isReadOnly: boolean;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<StageWithCapability | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | undefined>(undefined);

  const handleAdd = (index?: number) => {
    setEditingStage(null);
    setInsertIndex(index);
    setIsFormOpen(true);
  };

  const handleEdit = (stage: StageWithCapability) => {
    setEditingStage(stage);
    setInsertIndex(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = (stageId: string) => {
    setDeleteStageId(stageId);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stages.length - 1) return;

    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // swap
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];

    // extract IDs
    const stageIds = newStages.map(s => s.id);
    await reorderProcessStagesAction({ versionId, stageIds }, processId, versionId);
  };

  return (
    <div className="space-y-4">
      {!isReadOnly && stages.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">No stages defined yet.</p>
          <Button onClick={() => handleAdd()}>Add First Stage</Button>
        </div>
      )}

      {stages.map((stage, index) => (
        <div key={stage.id} className="relative">
          {/* Insert above line */}
          {!isReadOnly && (
            <div className="opacity-0 hover:opacity-100 flex justify-center -my-2 z-10 relative">
              <Button variant="outline" size="sm" className="h-6 rounded-full px-2" onClick={() => handleAdd(index)}>
                <Plus className="w-3 h-3 mr-1" /> Insert Above
              </Button>
            </div>
          )}

          <div className="flex gap-4 items-stretch bg-white border rounded-lg shadow-sm p-4 relative z-0">
            {/* Order Controls */}
            {!isReadOnly && (
              <div className="flex flex-col items-center justify-center gap-1 border-r pr-4">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMove(index, 'up')}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <div className="text-xs font-medium text-gray-400">{index + 1}</div>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === stages.length - 1} onClick={() => handleMove(index, 'down')}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Stage Info */}
            <div className="flex-1 py-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                  <div className="flex gap-2 text-sm text-gray-500 mt-1">
                    <span>{stage.estimatedDurationMins} mins</span>
                    {stage.capability && (
                      <>
                        <span>•</span>
                        <span>{stage.capability.name}</span>
                      </>
                    )}
                  </div>
                </div>
                {!isReadOnly && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(stage)}>
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(stage.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Badges/Settings */}
              <div className="flex flex-wrap gap-2 mt-3">
                {stage.requiresTLApproval && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    TL Approval Required
                  </span>
                )}
                {stage.requiresManualClientAcceptance && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Client Acceptance
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Insert below last line */}
      {!isReadOnly && stages.length > 0 && (
        <div className="opacity-0 hover:opacity-100 flex justify-center mt-2 z-10 relative">
          <Button variant="outline" size="sm" className="h-6 rounded-full px-2" onClick={() => handleAdd(stages.length)}>
            <Plus className="w-3 h-3 mr-1" /> Insert Below
          </Button>
        </div>
      )}

      {isFormOpen && (
        <StageFormDialog 
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          processId={processId}
          versionId={versionId}
          capabilities={capabilities}
          initialData={editingStage}
          insertIndex={insertIndex}
        />
      )}

      <ConfirmDialog
        open={deleteStageId !== null}
        onOpenChange={(open) => { if (!open) setDeleteStageId(null); }}
        title="Delete Stage"
        description="Are you sure you want to delete this process stage? This will remove it from this template version."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (deleteStageId) {
            await deleteProcessStageAction(deleteStageId, processId, versionId);
          }
        }}
      />
    </div>
  );
}
