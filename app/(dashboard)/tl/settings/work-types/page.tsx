import { WorkTypeService } from "@/services/WorkTypeService";
import { WorkTypesClient } from "./work-types-client";

export default async function WorkTypesPage() {
  const workTypes = await WorkTypeService.list();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Work Types</h3>
          <p className="text-sm text-gray-500">Manage definitions of work and deliverables.</p>
        </div>
      </div>

      <WorkTypesClient workTypes={workTypes} />
    </div>
  );
}
