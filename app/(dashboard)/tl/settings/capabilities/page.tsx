import { CapabilityService } from "@/services/CapabilityService";
import { CapabilitiesClient } from "./capabilities-client";

export default async function CapabilitiesPage() {
  const capabilities = await CapabilityService.list();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Capabilities</h3>
          <p className="text-sm text-gray-500">Manage internal team capabilities (roles/skills).</p>
        </div>
      </div>

      <CapabilitiesClient capabilities={capabilities} />
    </div>
  );
}
