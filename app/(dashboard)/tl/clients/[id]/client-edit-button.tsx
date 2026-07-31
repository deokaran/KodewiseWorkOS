"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatError } from "@/lib/utils";

const REVAMP_STAGES = [
  "None",
  "Requirement gathering",
  "Wireframing",
  "UI / UX design",
  "Development",
  "Content migration",
  "QA & internal testing",
  "UAT with client",
  "Go live"
];

export function ClientEditButton({ client, decrypted }: { client: any; decrypted: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notes metadata parsing
  let initialMeta = {
    amc: false,
    seo: false,
    revamp: "None",
    status: "Working",
    targets: [] as Array<{ name: string; value: number }>
  };

  if (client.notes) {
    try {
      const parsed = JSON.parse(client.notes);
      initialMeta = { ...initialMeta, ...parsed };
      if (!initialMeta.targets) {
        const arr: any[] = [];
        if (parsed.post > 0) arr.push({ name: "post", value: parsed.post });
        if (parsed.reel > 0) arr.push({ name: "reel", value: parsed.reel });
        if (parsed.customTargetName && parsed.customTargetValue > 0) {
          arr.push({ name: parsed.customTargetName, value: parsed.customTargetValue });
        }
        initialMeta.targets = arr;
      }
    } catch {
      // Ignore
    }
  }

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    contactPerson: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    amc: boolean;
    seo: boolean;
    revamp: string;
    status: string;
    targets: Array<{ name: string; value: number }>;
  }>({
    name: client.name || "",
    description: client.description || "",
    contactPerson: decrypted.contactPerson || "",
    email: decrypted.email || "",
    phone: decrypted.phone || "",
    website: decrypted.website || "",
    address: decrypted.address || "",
    amc: initialMeta.amc,
    seo: initialMeta.seo,
    revamp: initialMeta.revamp,
    status: initialMeta.status,
    targets: initialMeta.targets || []
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const customMeta = {
        amc: formData.amc,
        seo: formData.seo,
        status: formData.status,
        revamp: formData.revamp,
        targets: formData.targets
      };

      const body = {
        name: formData.name,
        description: formData.description,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        notes: JSON.stringify(customMeta),
        tagIds: client.tags.map((t: any) => t.tagId)
      };

      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success("Client profile updated successfully");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(formatError(err.message) || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="border-indigo-200 text-indigo-700 bg-indigo-50/30 hover:bg-indigo-50/80"
        onClick={() => setOpen(true)}
      >
        ⚙ Edit Profile
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-heading">Edit Client Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            {/* Main info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Client Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val || "Working" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Working">Working</SelectItem>
                    <SelectItem value="AMC">AMC</SelectItem>
                    <SelectItem value="SEO">SEO</SelectItem>
                    <SelectItem value="Revamp">Revamp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>

            {/* Contact Details */}
            <div className="border-t pt-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">Contact Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Contact Person</Label>
                  <Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Website</Label>
                  <Input placeholder="e.g. google.com" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Address</Label>
                  <Textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Services & Quotas */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Services &amp; Targets Quotas</h4>
              
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={formData.amc} 
                    onChange={(e) => setFormData({ ...formData, amc: e.target.checked })} 
                  />
                  <span>AMC Maintenance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={formData.seo} 
                    onChange={(e) => setFormData({ ...formData, seo: e.target.checked })} 
                  />
                  <span>SEO Audit & Outreach</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>Revamp Stage</Label>
                <Select value={formData.revamp} onValueChange={(val) => setFormData({ ...formData, revamp: val || "None" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Revamp Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVAMP_STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Targets Array Editor */}
              <div className="space-y-2 pt-2">
                <Label className="text-gray-700 font-semibold block">Active Targets Portfolio</Label>
                {formData.targets && formData.targets.length > 0 ? (
                  <div className="space-y-2 border p-3 rounded-lg bg-gray-50/50 max-h-[160px] overflow-y-auto">
                    {formData.targets.map((t, idx) => (
                      <div key={idx} className="flex gap-2 items-center justify-between">
                        <span className="capitalize text-xs font-semibold text-gray-700 min-w-[120px] truncate">{t.name}</span>
                        <div className="flex gap-1.5 items-center">
                          <Input
                            type="number"
                            className="h-8 w-20 text-center"
                            value={t.value}
                            onChange={(e) => {
                              const newTargets = [...formData.targets];
                              newTargets[idx].value = Number(e.target.value);
                              setFormData({ ...formData, targets: newTargets });
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 bg-red-50 text-red-650 hover:bg-red-100 border-red-200"
                            onClick={() => {
                              const newTargets = formData.targets.filter((_, i) => i !== idx);
                              setFormData({ ...formData, targets: newTargets });
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-3 text-center border border-dashed rounded-lg">No active targets defined.</p>
                )}
              </div>

              {/* Add New Target Type row */}
              <div className="border-t pt-3 space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-400 block font-bold">Add Custom Deliverable Target</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-new-target-name"
                    placeholder="e.g. stories, posts, reels"
                    className="h-8 flex-1"
                  />
                  <Input
                    id="edit-new-target-value"
                    type="number"
                    placeholder="Quota"
                    className="h-8 w-20 text-center"
                    defaultValue="0"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const nameInput = document.getElementById("edit-new-target-name") as HTMLInputElement;
                      const valueInput = document.getElementById("edit-new-target-value") as HTMLInputElement;
                      const val = Number(valueInput?.value) || 0;
                      const name = nameInput?.value?.trim()?.toLowerCase();

                      if (!name) {
                        toast.error("Target name is required");
                        return;
                      }

                      if (formData.targets.some(t => t.name === name)) {
                        toast.error(`Target "${name}" already exists`);
                        return;
                      }

                      const newTargets = [...formData.targets, { name, value: val }];
                      setFormData({ ...formData, targets: newTargets });
                      nameInput.value = "";
                      valueInput.value = "0";
                    }}
                    className="h-8 bg-indigo-600 text-white"
                  >
                    ＋ Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
