"use client";

import { useState } from "react";
import { Tag, TagType, BrandSequence } from "@prisma/client";
import { createTagAction, updateTagAction, deleteTagAction } from "@/actions/tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type TagWithSequence = Tag & { brandSequence: BrandSequence | null };

export function TagsClient({ tags }: { tags: TagWithSequence[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TagWithSequence | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{ name: string; type: TagType; color: string; icon: string; prefix: string }>({
    name: "",
    type: TagType.CUSTOM,
    color: "",
    icon: "",
    prefix: "",
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ name: "", type: TagType.CUSTOM, color: "", icon: "", prefix: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: TagWithSequence) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      color: item.color || "",
      icon: item.icon || "",
      prefix: item.brandSequence?.prefix || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        const res = await updateTagAction({ id: editingItem.id, ...formData });
        if (!res.success) throw new Error(res.error);
        toast.success("Tag updated");
      } else {
        const res = await createTagAction(formData);
        if (!res.success) throw new Error(res.error);
        toast.success("Tag created");
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save tag");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTagId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteTagId) {
      try {
        const res = await deleteTagAction(deleteTagId);
        if (!res.success) throw new Error(res.error);
        toast.success("Tag deleted");
      } catch (e: any) {
        toast.error(e.message || "Failed to delete tag");
      }
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleOpenCreate}>Add Tag</Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Brand Prefix</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>}
                    {item.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.type}</Badge>
                </TableCell>
                <TableCell>
                  {item.type === 'BRAND' && item.brandSequence ? (
                    <span className="text-sm font-mono">{item.brandSequence.prefix} (Next: {item.brandSequence.lastNumber + 1})</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {tags.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-4">No tags found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Tag' : 'Add Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select disabled={!!editingItem} value={formData.type} onValueChange={(v) => v && setFormData({...formData, type: v as TagType})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRAND">Brand</SelectItem>
                  <SelectItem value="CLIENT_TYPE">Client Type</SelectItem>
                  <SelectItem value="WORK_TYPE">Work Type</SelectItem>
                  <SelectItem value="STATUS">Status</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === 'BRAND' && !editingItem && (
              <div className="space-y-2">
                <Label>Brand Prefix</Label>
                <Input value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} placeholder="e.g. FC" />
                <p className="text-xs text-gray-500">Required for generating unique work numbers.</p>
              </div>
            )}
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

      <ConfirmDialog
        open={deleteTagId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTagId(null); }}
        title="Delete Tag"
        description="Are you sure you want to delete this tag? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
