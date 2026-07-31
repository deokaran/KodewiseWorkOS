"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { updateUserAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface EmployeeProfileCardProps {
  employee: any;
  allCapabilities: any[];
  allBrands: any[];
  allDepartments: any[];
}

export function EmployeeProfileCard({
  employee,
  allCapabilities = [],
  allBrands = [],
  allDepartments = [],
}: EmployeeProfileCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state
  const [formData, setFormData] = useState({
    name: employee.name || "",
    email: employee.email || "",
    roles: employee.roles || [employee.role],
    brandId: employee.brandId || "none",
    departmentId: employee.departmentId || "none",
    allowedPaid: employee.allowedPaid ?? 12,
    allowedCasual: employee.allowedCasual ?? 8,
    allowedSick: employee.allowedSick ?? 10,
    consecutivePunctualDays: employee.consecutivePunctualDays ?? 0,
    capabilities: employee.capabilities?.map((c: any) => c.id) || [],
  });

  const handleToggleCapability = (capId: string) => {
    setFormData(prev => {
      const caps = prev.capabilities;
      if (caps.includes(capId)) {
        return { ...prev, capabilities: caps.filter((id: string) => id !== capId) };
      } else {
        return { ...prev, capabilities: [...caps, capId] };
      }
    });
  };

  const handleToggleRole = (r: Role) => {
    setFormData(prev => {
      const roles = prev.roles;
      if (roles.includes(r)) {
        if (roles.length === 1) {
          toast.error("At least one designation/role is required");
          return prev;
        }
        return { ...prev, roles: roles.filter((roleVal: Role) => roleVal !== r) };
      } else {
        return { ...prev, roles: [...roles, r] };
      }
    });
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
      const payload = {
        id: employee.id,
        name: formData.name,
        email: formData.email,
        roles: formData.roles,
        brandId: formData.brandId === "none" ? null : formData.brandId,
        departmentId: formData.departmentId === "none" ? null : formData.departmentId,
        allowedPaid: formData.allowedPaid,
        allowedCasual: formData.allowedCasual,
        allowedSick: formData.allowedSick,
        consecutivePunctualDays: formData.consecutivePunctualDays,
        capabilities: formData.capabilities,
      };

      const res = await updateUserAction(payload);
      if (!res.success) throw new Error(res.error);

      toast.success("Employee profile updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      roles: employee.roles || [employee.role],
      brandId: employee.brandId || "none",
      departmentId: employee.departmentId || "none",
      allowedPaid: employee.allowedPaid ?? 12,
      allowedCasual: employee.allowedCasual ?? 8,
      allowedSick: employee.allowedSick ?? 10,
      consecutivePunctualDays: employee.consecutivePunctualDays ?? 0,
      capabilities: employee.capabilities?.map((c: any) => c.id) || [],
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="border-b pb-4 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 font-heading">Edit Profile</h3>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">
            Editing Mode
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-750">Full Name</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="rounded-lg h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-750">Official Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="rounded-lg h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-750">Designations</Label>
            <div className="flex flex-wrap gap-3 border p-2.5 rounded-lg bg-gray-50/50">
              {Object.values(Role).map(r => (
                <label key={r} className="flex items-center space-x-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(r)}
                    onChange={() => handleToggleRole(r)}
                    className="rounded border-gray-300 accent-indigo-650 h-3.5 w-3.5"
                  />
                  <span className="text-[11px] text-gray-750 font-medium">
                    {r === "TEAM_LEADER" ? "Team Leader" : r === "COLLABORATOR" ? "Collaborator" : "Employee"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-755">Brand Space</Label>
              <Select
                value={formData.brandId || "none"}
                onValueChange={val => setFormData({ ...formData, brandId: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-lg">
                  <SelectValue>
                    {formData.brandId === "none" || !formData.brandId
                      ? "None (Global)"
                      : allBrands.find(b => b.id === formData.brandId)?.name || formData.brandId}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Global)</SelectItem>
                  {allBrands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-755">Department</Label>
              <Select
                value={formData.departmentId || "none"}
                onValueChange={val => setFormData({ ...formData, departmentId: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-lg">
                  <SelectValue>
                    {formData.departmentId === "none" || !formData.departmentId
                      ? "None"
                      : allDepartments.find(d => d.id === formData.departmentId)?.name || formData.departmentId}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {allDepartments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leaves Limits */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-bold text-[10px] uppercase text-gray-400 tracking-wider">Leave Balance Allowances (Annual)</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Paid Leaves</Label>
                <Input
                  type="number"
                  value={formData.allowedPaid}
                  onChange={e => setFormData({ ...formData, allowedPaid: parseInt(e.target.value, 10) || 0 })}
                  min={0}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Casual Leaves</Label>
                <Input
                  type="number"
                  value={formData.allowedCasual}
                  onChange={e => setFormData({ ...formData, allowedCasual: parseInt(e.target.value, 10) || 0 })}
                  min={0}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Sick Leaves</Label>
                <Input
                  type="number"
                  value={formData.allowedSick}
                  onChange={e => setFormData({ ...formData, allowedSick: parseInt(e.target.value, 10) || 0 })}
                  min={0}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Punctuality Streak */}
          <div className="border-t pt-4 space-y-2">
            <Label className="text-xs font-bold text-gray-750 block">Punctuality Streak</Label>
            <div className="flex items-center gap-2 max-w-[120px]">
              <Input
                type="number"
                value={formData.consecutivePunctualDays}
                onChange={e => setFormData({ ...formData, consecutivePunctualDays: parseInt(e.target.value, 10) || 0 })}
                min={0}
                className="h-8 text-xs rounded-lg text-center font-bold"
              />
              <span className="text-[11px] text-gray-500 font-medium">days</span>
            </div>
          </div>

          {/* Capabilities */}
          <div className="border-t pt-4">
            <Label className="text-xs font-bold text-gray-750 block mb-2">Capabilities</Label>
            {allCapabilities.length > 0 ? (
              <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto p-2 border rounded-lg bg-gray-50/50">
                {allCapabilities.map(cap => {
                  const isChecked = formData.capabilities.includes(cap.id);
                  return (
                    <label key={cap.id} className="flex items-center gap-2 p-1 rounded hover:bg-gray-100/50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCapability(cap.id)}
                        className="rounded border-gray-300 text-indigo-650 h-3.5 w-3.5"
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

        <div className="flex gap-2 justify-end pt-3 border-t">
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <div className="border-b pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full border bg-slate-100 overflow-hidden flex-shrink-0 relative">
            {employee.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/users/${employee.id}/photo?t=${new Date(employee.updatedAt).getTime()}`}
                alt={employee.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xl bg-slate-100">
                {employee.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 leading-tight">{employee.name}</h3>
            <div className="flex gap-1 flex-wrap mt-1">
              {(employee.roles && employee.roles.length > 0) ? (
                employee.roles.map((r: string) => (
                  <Badge
                    key={r}
                    variant={r === 'TEAM_LEADER' ? 'default' : r === 'COLLABORATOR' ? 'outline' : 'secondary'}
                    className={`text-[9px] px-1 py-px ${r === 'COLLABORATOR' ? 'border-orange-200 text-orange-700 bg-orange-50' : ''}`}
                  >
                    {r === 'TEAM_LEADER' ? 'Team Leader' : r === 'COLLABORATOR' ? 'Collaborator' : 'Employee'}
                  </Badge>
                ))
              ) : (
                <Badge variant={employee.role === 'TEAM_LEADER' ? 'default' : 'secondary'} className="text-[9px] px-1 py-px">
                  {employee.role === 'TEAM_LEADER' ? 'Team Leader' : 'Employee'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-indigo-200 text-indigo-750 bg-indigo-50/20 hover:bg-indigo-50/60 text-xs font-semibold px-2.5"
          onClick={() => setIsEditing(true)}
        >
          ⚙ Edit Profile
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Official Email</span>
          <span className="text-gray-950 font-medium text-sm">{employee.email}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Personal Email</span>
          <span className="text-gray-950 font-medium text-sm">
            {employee.personalEmail || <span className="text-gray-400 italic font-normal">Not set</span>}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Mobile Number</span>
          <span className="text-gray-950 font-medium text-sm">
            {employee.mobileNumber || <span className="text-gray-400 italic font-normal">Not set</span>}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Date of Birth</span>
            <span className="text-gray-950 font-medium text-sm">
              {employee.dob ? new Date(employee.dob).toLocaleDateString() : <span className="text-gray-400 italic font-normal">Not set</span>}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Department</span>
            <span className="text-gray-950 font-semibold text-sm">
              {employee.department?.name || <span className="text-gray-400 font-normal italic">None</span>}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Aadhaar Number</span>
          <span className="text-gray-950 font-semibold text-sm">
            {employee.aadhaarNumber || <span className="text-gray-400 font-normal italic">Not set</span>}
          </span>
        </div>
        {employee.aadhaarPhoto && (
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Aadhaar Photo Proof</span>
            <a
              href={`/api/users/${employee.id}/aadhaar?t=${new Date(employee.updatedAt).getTime()}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs font-bold text-indigo-650 hover:underline gap-1"
            >
              View Document →
            </a>
          </div>
        )}

        {/* Leaves Counter */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="font-bold text-[10px] uppercase text-gray-400 tracking-wider">Leave Balance Allowances & Streak</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 border rounded-lg bg-gray-50/50 text-center">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">Paid</span>
              <span className="text-sm font-bold text-gray-800">
                {employee.usedPaid} / {employee.allowedPaid}
              </span>
            </div>
            <div className="p-2 border rounded-lg bg-gray-50/50 text-center">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">Casual</span>
              <span className="text-sm font-bold text-gray-800">
                {employee.usedCasual} / {employee.allowedCasual}
              </span>
            </div>
            <div className="p-2 border rounded-lg bg-gray-50/50 text-center">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">Sick</span>
              <span className="text-sm font-bold text-gray-800">
                {employee.usedSick} / {employee.allowedSick}
              </span>
            </div>
            <div className="p-2 border border-purple-100 rounded-lg bg-purple-50/10 text-center">
              <span className="text-[9px] text-purple-600 font-bold uppercase block">Streak</span>
              <span className="text-sm font-bold text-purple-950">
                {employee.consecutivePunctualDays ?? 0} / 20
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Assigned Brand Space</span>
          {employee.brand?.name ? (
            <Badge variant="outline" className="border-indigo-200 text-indigo-850 bg-indigo-50/40 mt-1">
              {employee.brand.name}
            </Badge>
          ) : (
            <span className="text-sm text-gray-500">None (Global)</span>
          )}
        </div>

        <div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Capabilities</span>
          <div className="flex gap-1.5 flex-wrap">
            {employee.capabilities?.map((cap: any) => (
              <Badge key={cap.id} variant="outline" className="text-gray-700">{cap.name}</Badge>
            ))}
            {(!employee.capabilities || employee.capabilities.length === 0) && (
              <span className="text-sm text-gray-500">No capabilities assigned</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
