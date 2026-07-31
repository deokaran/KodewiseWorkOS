"use client";

import { useState } from "react";
import { ProcessTemplate, ProcessTemplateVersion } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessFormDialog } from "../process-form-dialog";
import { archiveProcessAction } from "@/actions/processes";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ProcessHeader({ process }: { process: ProcessTemplate & { versions: ProcessTemplateVersion[] } }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();

  const handleArchiveConfirm = async () => {
    await archiveProcessAction(process.id);
    router.refresh();
    router.push("/tl/processes");
  };

  const isPublished = process.versions.some(v => v.isPublished);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{process.name}</h1>
          {process.deletedAt ? (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">Archived</Badge>
          ) : isPublished ? (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!process.deletedAt && (
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => setIsConfirmOpen(true)}>Archive Process</Button>
        )}
        <Button onClick={() => setIsEditOpen(true)}>Edit Details</Button>
      </div>

      {isEditOpen && (
        <ProcessFormDialog 
          open={isEditOpen} 
          onOpenChange={setIsEditOpen} 
          initialData={process}
        />
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Archive Process"
        description="Are you sure you want to archive this process template? This will hide it from new work assignments."
        confirmText="Archive"
        variant="destructive"
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
