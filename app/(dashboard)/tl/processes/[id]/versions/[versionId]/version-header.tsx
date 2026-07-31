"use client";

import { ProcessTemplate, ProcessTemplateVersion } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { duplicateVersionAction, publishVersionAction, unpublishVersionAction } from "@/actions/process-versions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VersionHeader({ version, template }: { version: ProcessTemplateVersion, template: ProcessTemplate }) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      const res = await duplicateVersionAction(version.id, template.id);
      if (res.success && res.data) {
        router.push(`/tl/processes/${template.id}/versions/${res.data.id}`);
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setIsPublishing(true);
      if (version.isPublished) {
        await unpublishVersionAction(version.id, template.id);
      } else {
        await publishVersionAction(version.id, template.id);
      }
      router.refresh();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">v{version.version} - {template.name}</h1>
          {version.isPublished ? (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {version.isPublished ? "This version is live and will be used for new work items." : "This version is a draft and can be edited."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleDuplicate} disabled={isDuplicating}>
          {isDuplicating ? 'Duplicating...' : 'Duplicate as new version'}
        </Button>
        <Button 
          variant={version.isPublished ? "outline" : "default"} 
          onClick={handleTogglePublish} 
          disabled={isPublishing}
          className={version.isPublished ? "text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700" : ""}
        >
          {isPublishing ? 'Updating...' : version.isPublished ? 'Unpublish Version' : 'Publish Version'}
        </Button>
      </div>
    </div>
  );
}
