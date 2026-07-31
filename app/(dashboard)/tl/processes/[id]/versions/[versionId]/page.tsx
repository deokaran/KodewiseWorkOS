import { notFound } from "next/navigation";
import Link from "next/link";
import { ProcessVersionService } from "@/services/ProcessVersionService";
import { CapabilityService } from "@/services/CapabilityService";
import { Badge } from "@/components/ui/badge";
import { StageBuilder } from "./stage-builder";
import { VersionHeader } from "./version-header";

export default async function ProcessVersionPage({ params }: { params: Promise<{ id: string, versionId: string }> }) {
  const { id, versionId } = await params;
  const [version, capabilities] = await Promise.all([
    ProcessVersionService.getById(versionId) as Promise<any>,
    CapabilityService.list()
  ]);

  if (!version || version.templateId !== id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/tl/processes" className="hover:text-indigo-600 hover:underline">Processes</Link>
        <span>/</span>
        <Link href={`/tl/processes/${version.templateId}`} className="hover:text-indigo-600 hover:underline">{version.template.name}</Link>
        <span>/</span>
        <span className="text-gray-900">v{version.version}</span>
      </div>

      <VersionHeader version={version} template={version.template} />

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stages</h3>
        <StageBuilder 
          processId={id} 
          versionId={versionId} 
          stages={version.stages} 
          capabilities={capabilities}
          isReadOnly={version.isPublished}
        />
      </div>
    </div>
  );
}
