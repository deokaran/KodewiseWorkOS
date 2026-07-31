"use client";

import { useState } from "react";
import { User, Capability, Role } from "@prisma/client";
import { createUserAction, updateUserAction, deleteUserAction } from "@/actions/users";
import { assignStageToUserAction } from "@/actions/stage-assignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WorkFormDialog } from "@/app/(dashboard)/tl/work/work-form-dialog";

type UserWithCapabilitiesAndBrand = User & { 
  capabilities: Capability[];
  brand?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
};

export function TeamClient({ 
  users, 
  capabilities, 
  brands = [], 
  poolItems = [],
  tags = [],
  clients = [],
  workTypes = [],
  processes = [],
  currentUserId,
  departments = []
}: { 
  users: UserWithCapabilitiesAndBrand[];
  capabilities: Capability[];
  brands: any[];
  poolItems: any[];
  tags?: any[];
  clients?: any[];
  workTypes?: any[];
  processes?: any[];
  currentUserId?: string;
  departments?: any[];
}) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  // Direct Assignment state
  const [assignUser, setAssignUser] = useState<UserWithCapabilitiesAndBrand | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string>("none");
  const [isAssigning, setIsAssigning] = useState(false);

  // Work Form Dialog state
  const [workAssignUser, setWorkAssignUser] = useState<UserWithCapabilitiesAndBrand | null>(null);
  const [isWorkFormOpen, setIsWorkFormOpen] = useState(false);
  
  const [formData, setFormData] = useState<{ 
    name: string; 
    email: string; 
    password?: string; 
    roles: Role[]; 
    capabilities: string[];
    brandId: string | null;
    departmentId: string | null;
    allowedPaid: number;
    allowedCasual: number;
    allowedSick: number;
  }>({
    name: "",
    email: "",
    password: "",
    roles: [Role.EMPLOYEE],
    capabilities: [],
    brandId: null,
    departmentId: null,
    allowedPaid: 12,
    allowedCasual: 8,
    allowedSick: 10
  });

  const handleOpenCreate = () => {
    setFormData({ 
      name: "", 
      email: "", 
      password: "", 
      roles: [Role.EMPLOYEE], 
      capabilities: [],
      brandId: null,
      departmentId: null,
      allowedPaid: 12,
      allowedCasual: 8,
      allowedSick: 10
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const res = await createUserAction(formData);
      if (!res.success) throw new Error(res.error);
      toast.success("User created successfully");
      setIsDialogOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to save user");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteUserId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteUserId) {
      try {
        const res = await deleteUserAction(deleteUserId);
        if (!res.success) throw new Error(res.error);
        toast.success("User deleted successfully");
        router.refresh();
      } catch (e: any) {
        toast.error(e.message || "Failed to delete user");
      }
    }
  };

  const handleDirectAssign = async () => {
    if (selectedStageId === "none" || !assignUser) {
      toast.error("Please select a stage to assign");
      return;
    }
    try {
      setIsAssigning(true);
      const res = await assignStageToUserAction(selectedStageId, assignUser.id);
      if (!res.success) throw new Error(res.error);
      toast.success(`Directly assigned work to ${assignUser.name} successfully`);
      setAssignUser(null);
      setSelectedStageId("none");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to assign stage");
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleCapability = (capId: string) => {
    setFormData(prev => {
      const caps = prev.capabilities;
      if (caps.includes(capId)) {
        return { ...prev, capabilities: caps.filter(id => id !== capId) };
      } else {
        return { ...prev, capabilities: [...caps, capId] };
      }
    });
  };

  // Filter pool items matching selected user's capabilities
  const getEligiblePoolItems = (user: UserWithCapabilitiesAndBrand) => {
    return poolItems.filter((item: any) => {
      if (item.capabilityId) {
        return user.capabilities.some((c: any) => c.id === item.capabilityId);
      }
      return true;
    });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleOpenCreate}>Add User</Button>
      </div>

      <div className="rounded-md border border-gray-200/80 bg-white overflow-x-auto">
        <Table className="min-w-[900px] lg:min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Brand Space</TableHead>
              <TableHead>Capabilities</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                <TableCell className="text-gray-600">{user.email}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {((user as any).roles && (user as any).roles.length > 0) ? (
                      (user as any).roles.map((r: string) => (
                        <Badge 
                          key={r} 
                          variant={r === 'TEAM_LEADER' ? 'default' : r === 'COLLABORATOR' ? 'outline' : 'secondary'}
                          className={r === 'COLLABORATOR' ? 'border-orange-200 text-orange-700 bg-orange-50' : ''}
                        >
                          {r === 'TEAM_LEADER' ? 'Team Leader' : r === 'COLLABORATOR' ? 'Collaborator' : 'Employee'}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant={user.role === 'TEAM_LEADER' ? 'default' : 'secondary'}>
                        {user.role === 'TEAM_LEADER' ? 'Team Leader' : 'Employee'}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 font-semibold">
                  {user.department?.name || <span className="text-gray-400 text-xs">-</span>}
                </TableCell>
                <TableCell className="text-gray-600 font-medium">
                  {user.brand?.name ? (
                    <Badge variant="outline" className="border-indigo-200 text-indigo-800 bg-indigo-50/50">
                      {user.brand.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">None (Global)</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {user.capabilities.map(cap => (
                      <Badge key={cap.id} variant="outline" className="text-gray-600">{cap.name}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  {user.role === "EMPLOYEE" && (
                    <>
                      <Link 
                        href={`/tl/team/${user.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-background px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        View Profile
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setWorkAssignUser(user);
                          setIsWorkFormOpen(true);
                        }}
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        Assign Work
                      </Button>
                    </>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Direct Assignment Dialog */}
      {assignUser && (
        <Dialog open={!!assignUser} onOpenChange={(open) => !open && setAssignUser(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Work to {assignUser.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-500">
                Directly assign an unassigned active stage from the division workspace matching this user&apos;s capabilities.
              </p>
              
              <div className="space-y-2">
                <Label>Select Active Stage</Label>
                <Select 
                  value={selectedStageId} 
                  onValueChange={(val) => setSelectedStageId(val || "none")}
                  items={[
                    { value: "none", label: "Select a stage..." },
                    ...getEligiblePoolItems(assignUser).map((item: any) => ({
                      value: item.id,
                      label: `${item.workItem.workNumber} - ${item.workItem.title} [Stage: ${item.stageTemplate.name}]`
                    }))
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a stage...</SelectItem>
                    {getEligiblePoolItems(assignUser).map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.workItem.workNumber} - {item.workItem.title} [Stage: {item.stageTemplate.name}]
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignUser(null)} disabled={isAssigning}>Cancel</Button>
              <Button onClick={handleDirectAssign} disabled={isAssigning || selectedStageId === "none"}>
                {isAssigning ? "Assigning..." : "Assign Work"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] min-h-[50vh] flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="name@kodewise.local" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••" />
            </div>
            
            <div className="space-y-2">
              <Label>Designations</Label>
              <div className="flex flex-wrap gap-4 border p-3 rounded-lg bg-gray-50/50">
                {Object.values(Role).map(r => (
                  <label key={r} className="flex items-center space-x-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={formData.roles.includes(r)}
                      onChange={() => {
                        setFormData(prev => {
                          const roles = prev.roles;
                          if (roles.includes(r)) {
                            return { ...prev, roles: roles.filter(roleVal => roleVal !== r) };
                          } else {
                            return { ...prev, roles: [...roles, r] };
                          }
                        });
                      }}
                      className="rounded border-gray-300 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      {r === "TEAM_LEADER" && "Team Leader"}
                      {r === "EMPLOYEE" && "Employee"}
                      {r === "COLLABORATOR" && "Collaborator"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assigned Brand Space</Label>
                <Select 
                  value={formData.brandId || "none"} 
                  onValueChange={(val) => setFormData({...formData, brandId: val === "none" ? null : val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Global / System)</SelectItem>
                    {brands.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select 
                  value={formData.departmentId || "none"} 
                  onValueChange={(val) => setFormData({...formData, departmentId: val === "none" ? null : val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t pt-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Paid Leaves</Label>
                <Input 
                  type="number" 
                  value={formData.allowedPaid} 
                  onChange={e => setFormData({...formData, allowedPaid: parseInt(e.target.value, 10) || 0})} 
                  min={0}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Casual Leaves</Label>
                <Input 
                  type="number" 
                  value={formData.allowedCasual} 
                  onChange={e => setFormData({...formData, allowedCasual: parseInt(e.target.value, 10) || 0})} 
                  min={0}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Sick Leaves</Label>
                <Input 
                  type="number" 
                  value={formData.allowedSick} 
                  onChange={e => setFormData({...formData, allowedSick: parseInt(e.target.value, 10) || 0})} 
                  min={0}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Capabilities</Label>
              <div className="flex flex-wrap gap-2 border p-3 rounded-md max-h-[140px] overflow-y-auto bg-gray-50/20">
                {capabilities.map(cap => (
                  <label key={cap.id} className="flex items-center space-x-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={formData.capabilities.includes(cap.id)}
                      onChange={() => toggleCapability(cap.id)}
                      className="rounded border-gray-300 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{cap.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2 border-t mt-auto">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-indigo-600 text-white hover:bg-indigo-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteUserId !== null}
        onOpenChange={(open) => { if (!open) setDeleteUserId(null); }}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />

      {isWorkFormOpen && (
        <WorkFormDialog
          open={isWorkFormOpen}
          onOpenChange={setIsWorkFormOpen}
          tags={tags}
          clients={clients}
          workTypes={workTypes}
          processes={processes}
          employees={users.filter(u => u.role === "EMPLOYEE")}
          currentUser={users.find(u => u.id === currentUserId) || (currentUserId ? { id: currentUserId, name: "Team Leader" } : undefined)}
          defaultAssigneeId={currentUserId}
          defaultProcessTemplateId={processes?.find((p: any) => p.name === "General Task (No Process)")?.id || "none"}
          prefilledEmployeeId={workAssignUser?.id}
        />
      )}
    </div>
  );
}
