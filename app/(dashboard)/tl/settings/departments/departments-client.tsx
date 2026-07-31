"use client";

import { useState } from "react";
import { Department } from "@prisma/client";
import { createDepartmentAction, updateDepartmentAction, deleteDepartmentAction } from "@/actions/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DepartmentWithCount = Department & { _count: { users: number } };

export function DepartmentsClient({ departments }: { departments: DepartmentWithCount[] }) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DepartmentWithCount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ name: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: DepartmentWithCount) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        const res = await updateDepartmentAction({ id: editingItem.id, ...formData });
        if (!res.success) throw new Error(res.error);
        toast.success("Department updated");
      } else {
        const res = await createDepartmentAction(formData);
        if (!res.success) throw new Error(res.error);
        toast.success("Department created");
      }
      setIsDialogOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to save department");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteDepartmentAction(deleteId);
      if (!res.success) throw new Error(res.error);
      toast.success("Department deleted successfully");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete department");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleOpenCreate} className="bg-slate-900 text-white hover:bg-slate-800">
          ＋ Add Department
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Assigned Team Members</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-gray-900">{item.name}</TableCell>
                <TableCell className="font-mono font-medium text-gray-600">{item._count.users}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {departments.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-4">No departments found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Department' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-slate-900 text-white hover:bg-slate-800">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Department"
        description="Are you sure you want to delete this department?"
        onConfirm={confirmDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
