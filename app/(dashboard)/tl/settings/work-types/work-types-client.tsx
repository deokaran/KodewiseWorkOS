"use client";

import { useState } from "react";
import { WorkType } from "@prisma/client";
import { createWorkTypeAction, updateWorkTypeAction } from "@/actions/work-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function WorkTypesClient({ workTypes }: { workTypes: WorkType[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkType | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    isDeliverable: false,
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ name: "", isDeliverable: false });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: WorkType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      isDeliverable: item.isDeliverable,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingItem) {
      await updateWorkTypeAction({ id: editingItem.id, ...formData });
    } else {
      await createWorkTypeAction(formData);
    }
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleOpenCreate}>Add Work Type</Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Is Deliverable</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workTypes.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.isDeliverable ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {workTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-4">No work types found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Work Type' : 'Add Work Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <input 
                type="checkbox" 
                id="isDeliverable"
                checked={formData.isDeliverable}
                onChange={e => setFormData({...formData, isDeliverable: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isDeliverable">Is Deliverable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
