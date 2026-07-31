"use client";

import { useState } from "react";
import Link from "next/link";
import { ProcessTemplate, ProcessTemplateVersion } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProcessFormDialog } from "./process-form-dialog";

type ProcessWithRelations = ProcessTemplate & {
  versions: ProcessTemplateVersion[];
  _count: { versions: number };
};

export function ProcessesClient({ initialProcesses }: { initialProcesses: ProcessWithRelations[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredProcesses = initialProcesses.filter(p => {
    // Basic search
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Status filter
    const isPublished = p.versions.some(v => v.isPublished);
    if (statusFilter === "PUBLISHED" && !isPublished) return false;
    if (statusFilter === "DRAFT" && isPublished) return false;
    if (statusFilter === "ARCHIVED" && !p.deletedAt) return false;
    if (statusFilter !== "ARCHIVED" && p.deletedAt) return false;

    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-2">
          <Input 
            placeholder="Search processes..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Create Process</Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Process Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Latest Version</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProcesses.map(process => {
              const latestVersion = process.versions[0];
              const publishedVersion = process.versions.find(v => v.isPublished);
              return (
                <TableRow key={process.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <Link href={`/tl/processes/${process.id}`} className="text-indigo-600 hover:underline">
                        <span>{process.name}</span>
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                      {process.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    v{latestVersion?.version || 1}
                  </TableCell>
                  <TableCell>
                    {process.deletedAt ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : publishedVersion ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        Published (v{publishedVersion.version})
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProcesses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                  No processes found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isFormOpen && (
        <ProcessFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
        />
      )}
    </div>
  );
}
