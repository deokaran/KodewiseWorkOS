"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkFormDialog } from "./work-form-dialog";

export function WorkClient({ initialWorkItems, tags, clients, workTypes, processes, employees, currentUser }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const filtered = initialWorkItems.filter((w: any) => {
    if (search && !w.title.toLowerCase().includes(search.toLowerCase()) && !w.workNumber.toLowerCase().includes(search.toLowerCase())) return false;
    
    if (statusFilter === "ALL") return true;
    if (statusFilter === "ARCHIVED" && w.deletedAt) return true;
    if (statusFilter !== "ARCHIVED" && w.deletedAt) return false;
    if (statusFilter === "ACTIVE" && w.status !== "COMPLETED" && w.status !== "CANCELLED" && !w.deletedAt) return true;
    if (statusFilter === w.status && !w.deletedAt) return true;
    return false;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-2">
          <Input 
            placeholder="Search by ID or title..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ACTIVE")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Create Work Item</Button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item: any) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-indigo-600">
                  <Link href={`/tl/work/${item.id}`} className="hover:underline">
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
                  {item.deletedAt ? (
                    <Badge variant="secondary">Archived</Badge>
                  ) : (
                    <Badge variant="outline">{item.status}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {item.processVersion.template.name} v{item.processVersion.version}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                  No work items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isFormOpen && (
        <WorkFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
          tags={tags}
          clients={clients}
          workTypes={workTypes}
          processes={processes}
          employees={employees}
          currentUser={currentUser}
          defaultAssigneeId={currentUser?.id}
        />
      )}
    </div>
  );
}
