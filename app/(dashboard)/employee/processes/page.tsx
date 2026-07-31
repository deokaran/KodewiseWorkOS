import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProcessTemplate, ProcessTemplateVersion } from "@prisma/client";

export default async function EmployeeProcessesPage() {
  const allProcesses = await ProcessTemplateService.list();
  
  // Filter for published ones only
  const publishedProcesses = allProcesses.filter(p => p.versions.some(v => v.isPublished));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Process Library</h2>
        <p className="text-sm text-gray-500">
          View standardized workflow processes for the studio.
        </p>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Process Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Current Version</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publishedProcesses.map(process => {
              const publishedVersion = process.versions.find(v => v.isPublished);
              return (
                <TableRow key={process.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link href={`/employee/processes/${process.id}`} className="text-indigo-600 hover:underline">
                      {process.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                      {process.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">v{publishedVersion?.version}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {publishedProcesses.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-gray-500">
                  No published processes available yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
