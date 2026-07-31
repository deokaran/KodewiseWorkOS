"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TargetsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fcWeeklyTarget: number;
  setFcWeeklyTarget: (target: number) => void;
  fcMonthlyTarget: number;
  setFcMonthlyTarget: (target: number) => void;
  onSave: () => void;
}

export function TargetsDialog({
  isOpen,
  onOpenChange,
  fcWeeklyTarget,
  setFcWeeklyTarget,
  fcMonthlyTarget,
  setFcMonthlyTarget,
  onSave,
}: TargetsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Football Counter Publication Targets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Weekly Target (Posts &amp; Reels)</Label>
            <Input
              type="number"
              value={fcWeeklyTarget}
              onChange={(e) => setFcWeeklyTarget(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Monthly Target</Label>
            <Input
              type="number"
              value={fcMonthlyTarget}
              onChange={(e) => setFcMonthlyTarget(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-slate-900 text-white" onClick={onSave}>
            Save Targets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
