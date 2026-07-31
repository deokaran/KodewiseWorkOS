import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function GlobalHistoryPage() {
  const user = await requireAuth();

  // Fetch all audit logs across all brand spaces combined
  const logs = await prisma.auditLog.findMany({
    include: {
      user: true,
      workItem: {
        include: {
          primaryBrandTag: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">Global History</h2>
        <p className="text-sm text-gray-500">
          Full audit history of all actions, updates, and deliverables across the studio.
        </p>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[150px]">Work Item ID</TableHead>
              <TableHead>Work Item Title</TableHead>
              <TableHead className="w-[150px]">User</TableHead>
              <TableHead className="w-[120px]">Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const metadata = log.metadata as Record<string, any> | null;
              const detailsMessage = metadata?.message || "-";
              const detailLink = user.role === "TEAM_LEADER" 
                ? `/tl/work/${log.workItemId}` 
                : `/employee/work/${log.workItemId}`;

              return (
                <TableRow key={log.id} className="hover:bg-gray-50">
                  <TableCell className="text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-indigo-600">
                    <Link href={detailLink} className="hover:underline">
                      {log.workItem.workNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-950 font-medium max-w-[200px] truncate">
                    {log.workItem.title}
                  </TableCell>
                  <TableCell className="text-gray-600 font-medium">
                    {log.user ? log.user.name : "System"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      log.action === "CREATED" ? "secondary" :
                      log.action === "ASSIGNED" ? "outline" :
                      log.action === "STAGE_COMPLETED" ? "default" :
                      "destructive"
                    }>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {detailsMessage}
                  </TableCell>
                </TableRow>
              );
            })}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                  No history events found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
