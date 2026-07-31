import { EventTypeService } from "@/services/EventTypeService";
import { EventTypesClient } from "./event-types-client";

export default async function EventTypesPage() {
  const eventTypes = await EventTypeService.list();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Event Types</h3>
          <p className="text-sm text-gray-500">Manage calendar event categories.</p>
        </div>
      </div>

      <EventTypesClient eventTypes={eventTypes} />
    </div>
  );
}
