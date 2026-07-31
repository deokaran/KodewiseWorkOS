"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkFormDialog } from "../work-form-dialog";
import { archiveWorkItemAction } from "@/actions/work-items";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { createGoogleCalendarUrl } from "@/lib/gcal";
import { formatDateTime } from "@/lib/utils";

export function WorkHeader({ workItem, tags, clients, workTypes, processes, employees, currentUser }: any) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();

  const handleArchiveConfirm = async () => {
    await archiveWorkItemAction(workItem.id);
    router.refresh();
    router.push("/tl/work");
  };

  const gcalUrl = createGoogleCalendarUrl({
    title: `[${workItem.workNumber}] ${workItem.title}`,
    description: `Work Item: ${workItem.workNumber} - ${workItem.title}\nBrand: ${workItem.primaryBrandTag?.name}\nPriority: ${workItem.priority}`,
    startDate: workItem.estimatedEnd ? new Date(workItem.estimatedEnd) : new Date(),
    endDate: workItem.estimatedEnd ? new Date(workItem.estimatedEnd) : null,
  });

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200/80">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{workItem.workNumber}</h1>
          <span className="text-lg text-gray-500">{workItem.title}</span>
          
          <Badge variant="outline">{workItem.primaryBrandTag.name}</Badge>

          {workItem.deletedAt ? (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">Archived</Badge>
          ) : (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">{workItem.status}</Badge>
          )}

          <Badge variant={workItem.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>{workItem.priority}</Badge>

          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
            🕒 {formatDateTime(workItem.createdAt)}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href={gcalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
        >
          <span>📅 Add to Google Calendar</span>
        </a>
        {!workItem.deletedAt && (
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => setIsConfirmOpen(true)}>Archive</Button>
        )}
        <Button onClick={() => setIsEditOpen(true)}>Edit Details</Button>
      </div>

      {isEditOpen && (
        <WorkFormDialog 
          open={isEditOpen} 
          onOpenChange={setIsEditOpen} 
          initialData={workItem}
          tags={tags}
          clients={clients}
          workTypes={workTypes}
          processes={processes}
          employees={employees}
          currentUser={currentUser}
        />
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Archive Work Item"
        description="Are you sure you want to archive this work item? You can restore it later if needed."
        confirmText="Archive"
        variant="destructive"
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
