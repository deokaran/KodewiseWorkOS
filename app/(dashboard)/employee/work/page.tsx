import { WorkItemService } from "@/services/WorkItemService";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";

import { formatDateTime } from "@/lib/utils";

export default async function EmployeeWorkItemsPage() {
  const user = await requireRole("EMPLOYEE");

  const [dbUser, workItems] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: { capabilities: true }
    }),
    WorkItemService.list()
  ]);

  if (!dbUser) {
    return <div>User not found.</div>;
  }

  const userCapIds = dbUser.capabilities.map((c: any) => c.id);

  const filteredWorkItems = workItems.filter((item: any) => {
    if (item.deletedAt) return false;
    if (!item.currentStage) return false;
    
    const stage = item.currentStage;
    if (stage.assignedUserId === user.id) return true;
    if (!stage.assignedUserId) {
      if (!stage.capabilityId) return true;
      return userCapIds.includes(stage.capabilityId);
    }
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Work Items</h2>
        <p className="text-sm text-gray-500">
          View all active work across the studio.
        </p>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Process</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkItems.map((item: any) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-indigo-600">
                  <Link href={`/employee/work/${item.id}`} className="hover:underline">
                    {item.workNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.client?.name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.primaryBrandTag.name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.priority === "CRITICAL" ? "destructive" : "secondary"}>
                    {item.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {item.processVersion.template.name} v{item.processVersion.version}
                </TableCell>
                <TableCell className="text-xs text-gray-500 font-medium">
                  {formatDateTime(item.createdAt)}
                </TableCell>
              </TableRow>
            ))}
            {filteredWorkItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                  No active work items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
