import { DepartmentService } from "@/services/DepartmentService";
import { DepartmentsClient } from "./departments-client";

export default async function DepartmentsPage() {
  const departments = await DepartmentService.list();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Departments</h3>
          <p className="text-sm text-gray-500">Manage internal studio departments (e.g. Design, Editorial, Dev).</p>
        </div>
      </div>

      <DepartmentsClient departments={departments} />
    </div>
  );
}
