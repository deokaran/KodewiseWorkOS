import { TagService } from "@/services/TagService";
import { TagsClient } from "./tags-client";

export default async function TagsPage() {
  const tags = await TagService.list();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Tags</h3>
          <p className="text-sm text-gray-500">Manage tags for brands, clients, and statuses.</p>
        </div>
      </div>

      <TagsClient tags={tags} />
    </div>
  );
}
