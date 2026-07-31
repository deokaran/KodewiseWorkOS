"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatError } from "@/lib/utils";

export function TeamMemberEditButton({ employee, allCapabilities = [], allBrands = [] }: { employee: any; allCapabilities: any[]; allBrands: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialCaps = (employee.capabilities || []).map((c: any) => c.id || c.name);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: string;
    brandId: string;
    capabilities: string[];
  }>({
    name: employee.name || "",
    email: employee.email || "",
    role: employee.role || "EMPLOYEE",
    brandId: employee.brandId || "global",
    capabilities: initialCaps as string[]
  });

  const handleToggleCapability = (capId: string) => {
    if (formData.capabilities.includes(capId)) {
      setFormData({
        ...formData,
        capabilities: formData.capabilities.filter(id => id !== capId)
      });
    } else {
      setFormData({
        ...formData,
        capabilities: [...formData.capabilities, capId]
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        id: employee.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        brandId: formData.brandId === "global" ? null : formData.brandId,
        capabilities: formData.capabilities
      };

      const res = await fetch(`/api/users/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success("Team member profile updated successfully");
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
        <DialogContent className="max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading">Edit Member Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div className="space-y-1">
            <Label>Email Address</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>System Role</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val || "EMPLOYEE" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Brand Space</Label>
              <Select value={formData.brandId} onValueChange={(val) => setFormData({ ...formData, brandId: val || "global" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Brand Space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">None (Global)</SelectItem>
                  {allBrands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Capabilities */}
          <div className="border-t pt-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Capabilities</Label>
            {allCapabilities.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-1 border rounded-lg bg-gray-50/50">
                {allCapabilities.map(cap => {
                  const isChecked = formData.capabilities.includes(cap.id);
                  return (
                    <label key={cap.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100/50 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        checked={isChecked} 
                        onChange={() => handleToggleCapability(cap.id)} 
                      />
                      <span className="text-xs font-medium text-gray-700">{cap.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-gray-500">No capabilities configured.</span>
            )}
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
