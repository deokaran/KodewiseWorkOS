"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingLog: any;
  setEditingLog: (log: any) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}

export function LogDialog({
  isOpen,
  onOpenChange,
  editingLog,
  setEditingLog,
  onSave,
  onDelete,
}: LogDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingLog?.id.startsWith("new") ? "Record Work Log" : "Edit Work Log Entry"}
          </DialogTitle>
        </DialogHeader>
        {editingLog && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={editingLog.company}
                  onValueChange={(val) => setEditingLog({ ...editingLog, company: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kodewise">Kodewise</SelectItem>
                    <SelectItem value="Football Counter">Football Counter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  value={editingLog.client}
                  onChange={(e) => setEditingLog({ ...editingLog, client: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editingLog.category}
                  onValueChange={(val) => setEditingLog({ ...editingLog, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMC">AMC</SelectItem>
                    <SelectItem value="SEO">SEO</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Photography / Field Day">Photography / Field Day</SelectItem>
                    <SelectItem value="Match Coverage">Match Coverage</SelectItem>
                    <SelectItem value="Client Update / Meeting">Client Update / Meeting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingLog.status}
                  onValueChange={(val) => setEditingLog({ ...editingLog, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Task Done / Description</Label>
              <Input
                value={editingLog.task}
                onChange={(e) => setEditingLog({ ...editingLog, task: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editingLog.notes}
                onChange={(e) => setEditingLog({ ...editingLog, notes: e.target.value })}
              />
            </div>
          </div>
        )}
        <DialogFooter className="flex justify-between items-center w-full">
          {editingLog && !editingLog.id.startsWith("new") && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(editingLog.id);
                onOpenChange(false);
              }}
            >
              Delete Log
            </Button>
          )}
          <div className="space-x-1 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="bg-slate-900 text-white" onClick={onSave}>
              Save Log
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
