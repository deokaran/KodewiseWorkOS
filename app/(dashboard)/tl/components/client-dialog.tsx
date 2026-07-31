"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient: any;
  setEditingClient: (client: any) => void;
  clientCompanyType: "KW" | "FC";
  onSave: () => void;
}

export function ClientDialog({
  isOpen,
  onOpenChange,
  editingClient,
  setEditingClient,
  clientCompanyType,
  onSave,
}: ClientDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingClient?.id.startsWith("new") ? "Add Client" : "Edit Client"} -{" "}
            {clientCompanyType === "KW" ? "Kodewise" : "Football Counter"}
          </DialogTitle>
        </DialogHeader>
        {editingClient && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                value={editingClient.name}
                onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Client Code (Optional - e.g. 001)</Label>
              <Input
                placeholder="Will auto-generate (001, 002...) if left empty"
                value={editingClient.clientCode || ""}
                onChange={(e) => setEditingClient({ ...editingClient, clientCode: e.target.value })}
              />
            </div>

            {clientCompanyType === "KW" ? (
              <>
                <div className="flex items-center gap-4 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_amc"
                      checked={editingClient.amc}
                      onChange={(e) => setEditingClient({ ...editingClient, amc: e.target.checked })}
                    />
                    <Label htmlFor="edit_amc">AMC Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_seo"
                      checked={editingClient.seo}
                      onChange={(e) => setEditingClient({ ...editingClient, seo: e.target.checked })}
                    />
                    <Label htmlFor="edit_seo">SEO Active</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingClient.status}
                    onValueChange={(val) => setEditingClient({ ...editingClient, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Working">Working</SelectItem>
                      <SelectItem value="Beta — pending go-live">Beta — pending go-live</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Revamp Stage</Label>
                  <Select
                    value={editingClient.revamp}
                    onValueChange={(val) => setEditingClient({ ...editingClient, revamp: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="In progress (UAT)">In progress (UAT)</SelectItem>
                      <SelectItem value="Requirement gathering">Requirement gathering</SelectItem>
                      <SelectItem value="Near future">Near future</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Label className="text-gray-700 font-semibold block">Weekly Target Deliverables</Label>
                
                {/* List targets dynamically */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto border p-3 rounded-lg bg-gray-50/50">
                  {((editingClient.targets && editingClient.targets.length > 0) ? editingClient.targets : [
                    { name: "post", value: Number(editingClient.post || 0) },
                    { name: "reel", value: Number(editingClient.reel || 0) }
                  ]).map((t: any, index: number, arr: any[]) => (
                    <div key={index} className="flex gap-2 items-center justify-between">
                      <div className="flex-1">
                        <Input
                          placeholder="Target Type (e.g. post, reel, shoot)"
                          className="h-9 text-sm"
                          value={t.name}
                          onChange={(e) => {
                            const currentTargets = editingClient.targets ? [...editingClient.targets] : [...arr];
                            const updatedTargets = [...currentTargets];
                            updatedTargets[index] = { ...updatedTargets[index], name: e.target.value };
                            setEditingClient({ 
                              ...editingClient, 
                              targets: updatedTargets 
                            });
                          }}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Amount"
                          className="h-9 text-center text-sm"
                          value={t.value}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const positiveVal = val >= 0 ? val : 0;
                            const currentTargets = editingClient.targets ? [...editingClient.targets] : [...arr];
                            const updatedTargets = [...currentTargets];
                            updatedTargets[index] = { ...updatedTargets[index], value: positiveVal };
                            
                            setEditingClient({ 
                              ...editingClient, 
                              targets: updatedTargets,
                              ...(updatedTargets[index].name === "post" ? { post: positiveVal } : {}),
                              ...(updatedTargets[index].name === "reel" ? { reel: positiveVal } : {})
                            });
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9 bg-red-50 text-red-650 hover:bg-red-100 border-red-200"
                        onClick={() => {
                          const currentTargets = editingClient.targets ? [...editingClient.targets] : [...arr];
                          const updatedTargets = currentTargets.filter((_, i) => i !== index);
                          setEditingClient({ 
                            ...editingClient, 
                            targets: updatedTargets 
                          });
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  {(!editingClient.targets || editingClient.targets.length === 0) && (
                    <p className="text-xs text-gray-400 py-2 text-center">No weekly targets defined.</p>
                  )}
                </div>

                {/* Add deliverable row button */}
                <div className="flex justify-start">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentTargets = editingClient.targets || [
                        { name: "post", value: Number(editingClient.post || 0) },
                        { name: "reel", value: Number(editingClient.reel || 0) }
                      ];
                      const newTargets = [...currentTargets, { name: "", value: 0 }];
                      setEditingClient({ ...editingClient, targets: newTargets });
                    }}
                    className="h-8 border-indigo-100 text-indigo-650 bg-indigo-50/20 hover:bg-indigo-50 font-medium"
                  >
                    ＋ Add Deliverable Row
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={onSave}>
            Save Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
