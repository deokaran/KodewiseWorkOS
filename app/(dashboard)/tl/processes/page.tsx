import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { ProcessesClient } from "./processes-client";

export default async function ProcessesPage() {
  const processes = await ProcessTemplateService.list();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Process Builder</h2>
        <p className="text-sm text-gray-500">
          Design and manage workflow templates.
        </p>
      </div>

      <ProcessesClient initialProcesses={processes} />
    </div>
  );
}
