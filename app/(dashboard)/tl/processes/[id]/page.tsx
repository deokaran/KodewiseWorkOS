import { notFound } from "next/navigation";
import Link from "next/link";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProcessHeader } from "./process-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

export default async function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const process = await ProcessTemplateService.getById(id);

  if (!process) {
    notFound();
  }

  const publishedVersion = process.versions.find(v => v.isPublished);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/tl/processes" className="hover:text-indigo-600 hover:underline">Processes</Link>
        <span>/</span>
        <span className="text-gray-900">{process.name}</span>
      </div>

      <ProcessHeader process={process} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stages</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {process.versions.map(version => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">
                        v{version.version}
                      </TableCell>
                      <TableCell>
                        {version.isPublished ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell>{version._count.stages} stages</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/tl/processes/${process.id}/versions/${version.id}`}>
                          <Button variant="ghost" size="sm">Open Builder</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {process.versions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                        No versions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Process Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Name</h4>
                <p className="mt-1 text-sm text-gray-900">{process.name}</p>
              </div>
              {process.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1 text-sm text-gray-900">{process.description}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Current Published</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {publishedVersion ? `v${publishedVersion.version}` : 'None'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
