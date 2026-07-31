import { notFound } from "next/navigation";
import Link from "next/link";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { ProcessVersionService } from "@/services/ProcessVersionService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default async function EmployeeProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const process = await ProcessTemplateService.getById(id);

  if (!process) {
    notFound();
  }

  const publishedVersionSummary = process.versions.find(v => v.isPublished);
  if (!publishedVersionSummary) {
    notFound(); // Employees can only see published processes
  }

  const publishedVersion = await ProcessVersionService.getById(publishedVersionSummary.id) as any;

  if (!publishedVersion) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/employee/processes" className="hover:text-indigo-600 hover:underline">Processes</Link>
        <span>/</span>
        <span className="text-gray-900">{process.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{process.name}</h1>
            <Badge variant="default" className="bg-green-100 text-green-800">Active Version: v{publishedVersion.version}</Badge>
          </div>
          {process.description && (
            <p className="text-sm text-gray-500 mt-2">{process.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Process Stages</h3>
        
        {publishedVersion.stages.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg bg-gray-50 text-gray-500">
            No stages are defined for this process.
          </div>
        ) : (
          <div className="space-y-4">
            {publishedVersion.stages.map((stage: any, index: number) => (
              <div key={stage.id} className="flex gap-4 items-stretch bg-white border rounded-lg shadow-sm p-4">
                <div className="flex flex-col items-center justify-center gap-1 border-r pr-4 min-w-[3rem]">
                  <div className="text-sm font-medium text-gray-400">#{index + 1}</div>
                </div>

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
                  </div>

                  {stage.instructions && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
                      {stage.instructions}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {stage.requiresTLApproval && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        TL Approval Required
                      </span>
                    )}
                    {stage.requiresManualClientAcceptance && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Client Acceptance Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
