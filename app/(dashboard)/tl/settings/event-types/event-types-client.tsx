"use client";

import { useState } from "react";
import { EventType } from "@prisma/client";
import { createEventTypeAction, updateEventTypeAction } from "@/actions/event-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function EventTypesClient({ eventTypes }: { eventTypes: EventType[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventType | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    color: "",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ name: "", color: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: EventType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      color: item.color || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingItem) {
      await updateEventTypeAction({ id: editingItem.id, ...formData });
    } else {
      await createEventTypeAction(formData);
    }
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleOpenCreate}>Add Event Type</Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventTypes.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>}
                    {item.name}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {eventTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-gray-500 py-4">No event types found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Event Type' : 'Add Event Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Color (Hex)</Label>
              <Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="#000000" />
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
