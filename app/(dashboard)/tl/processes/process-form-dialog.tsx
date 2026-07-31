"use client";

import { useState } from "react";
import { createProcessAction, updateProcessAction } from "@/actions/processes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProcessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export function ProcessFormDialog({ open, onOpenChange, initialData }: ProcessFormDialogProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (initialData) {
        const res = await updateProcessAction({ id: initialData.id, ...formData });
        if (!res.success) throw new Error(res.error);
        toast.success("Process updated successfully");
        onOpenChange(false);
      } else {
        const res = await createProcessAction(formData);
        if (!res.success) throw new Error(res.error);
        toast.success("Process created successfully");
        onOpenChange(false);
        router.push(`/tl/processes/${res.data.id}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save process");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Process' : 'Create New Process'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Standard Onboarding" />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="What is this process for?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Process'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
