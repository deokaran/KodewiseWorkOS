"use client";

import { useState } from "react";
import { Capability } from "@prisma/client";
import { createCapabilityAction, updateCapabilityAction } from "@/actions/capabilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type CapabilityWithCount = Capability & { _count: { users: number } };

export function CapabilitiesClient({ capabilities }: { capabilities: CapabilityWithCount[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CapabilityWithCount | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ name: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: CapabilityWithCount) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        const res = await updateCapabilityAction({ id: editingItem.id, ...formData });
        if (!res.success) throw new Error(res.error);
        toast.success("Capability updated");
      } else {
        const res = await createCapabilityAction(formData);
        if (!res.success) throw new Error(res.error);
        toast.success("Capability created");
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save capability");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleOpenCreate}>Add Capability</Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Assigned Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {capabilities.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item._count.users}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {capabilities.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-4">No capabilities found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Capability' : 'Add Capability'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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
