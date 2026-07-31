"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClientDialog } from "../components/client-dialog";

interface ClientsClientPageProps {
  initialClients: any[];
  brands: any[];
  filterBrand?: string;
}

export function ClientsClientPage({ initialClients = [], brands = [], filterBrand }: ClientsClientPageProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);

  // Quick edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ClientDialog states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientCompanyType, setClientCompanyType] = useState<"KW" | "FC">("KW");

  const handleOpenAddClient = () => {
    const type = filterBrand?.toUpperCase() === "FC" ? "FC" : "KW";
    setClientCompanyType(type);
    setEditingClient({
      id: `new-${Date.now()}`,
      name: "",
      clientCode: "",
      description: "",
      amc: false,
      seo: false,
      status: "Working",
      revamp: "None",
      targets: [
        { name: "post", value: 0 },
        { name: "reel", value: 0 }
      ],
      tagIds: []
    });
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (c: any) => {
    const type = filterBrand?.toUpperCase() === "FC" ? "FC" : "KW";
    setClientCompanyType(type);

    let custom = { amc: false, seo: false, status: "Working", revamp: "None", targets: [] };
    if (c.notes) {
      try {
        const parsed = JSON.parse(c.notes);
        custom = { ...custom, ...parsed };
        if (!custom.targets) {
          const arr: any[] = [];
          if (parsed.post > 0) arr.push({ name: "post", value: parsed.post });
          if (parsed.reel > 0) arr.push({ name: "reel", value: parsed.reel });
          custom.targets = arr as any;
        }
      } catch (e) {}
    }

    setEditingClient({
      id: c.id,
      name: c.name,
      clientCode: c.clientCode || "",
      description: c.description || "",
      amc: custom.amc,
      seo: custom.seo,
      status: custom.status,
      revamp: custom.revamp,
      targets: custom.targets || [],
      tagIds: c.tags?.map((t: any) => t.tagId) || []
    });
    setIsClientModalOpen(true);
  };

  const handleToggleActive = async (client: any) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name,
          clientCode: client.clientCode || undefined,
          isActive: client.isActive === false ? true : false,
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(`Client ${client.isActive === false ? 'activated' : 'deactivated'} successfully`);
      
      const updatedRes = await fetch("/api/clients");
      const updatedJson = await updatedRes.json();
      if (updatedJson.success) {
        setClients(updatedJson.data);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle client status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClient = async () => {
    if (!editingClient || !editingClient.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    // Validate FC weekly target deliverables if targets is present
    if (clientCompanyType === "FC" && editingClient.targets) {
      for (const t of editingClient.targets) {
        if (!t.name || !t.name.trim()) {
          toast.error("Weekly target deliverable type name is required.");
          return;
        }
        if (t.value < 0) {
          toast.error("Weekly target amount cannot be negative.");
          return;
        }
      }
    }

    const customMeta = {
      amc: editingClient.amc,
      seo: editingClient.seo,
      status: editingClient.status,
      revamp: editingClient.revamp,
      targets: editingClient.targets || [
        { name: "post", value: Number(editingClient.post || 0) },
        { name: "reel", value: Number(editingClient.reel || 0) }
      ]
    };

    const brandTagName = clientCompanyType === "KW" ? "Kodewise" : "Football Counter";
    const brandTag = brands.find(b => b.name === brandTagName);
    if (!brandTag) {
      toast.error(`${brandTagName} brand tag not found`);
      return;
    }

    const body = {
      name: editingClient.name,
      clientCode: editingClient.clientCode || undefined,
      description: editingClient.description || `${brandTagName} Client`,
      notes: JSON.stringify(customMeta),
      tagIds: [brandTag.id]
    };

    setIsSaving(true);
    try {
      const isNew = editingClient.id.startsWith("new");
      const url = isNew ? "/api/clients" : `/api/clients/${editingClient.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(isNew ? "Client created successfully" : "Client updated successfully");
      setIsClientModalOpen(false);
      setEditingClient(null);

      // Fetch fresh clients list
      const updatedRes = await fetch("/api/clients");
      const updatedJson = await updatedRes.json();
      if (updatedJson.success) {
        setClients(updatedJson.data);
      }

      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save client");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter clients by brand parameter
  const filteredClients = clients.filter(c => {
    if (!filterBrand) return true;
    const tagName = filterBrand.toLowerCase() === "fc" ? "Football Counter" : "Kodewise";
    return c.tags?.some((t: any) => t.tag?.name === tagName);
  });

  const handleOpenEdit = (client: any) => {
    let custom = { amc: false, seo: false, status: "Working", revamp: "None", targets: [] };
    if (client.notes) {
      try {
        const parsed = JSON.parse(client.notes);
        custom = { ...custom, ...parsed };
        if (!custom.targets) {
          const arr: any[] = [];
          if (parsed.post > 0) arr.push({ name: "post", value: parsed.post });
          if (parsed.reel > 0) arr.push({ name: "reel", value: parsed.reel });
          if (parsed.customTargetName && parsed.customTargetValue > 0) {
            arr.push({ name: parsed.customTargetName, value: parsed.customTargetValue });
          }
          custom.targets = arr as any;
        }
      } catch (e) {
        // Ignore
      }
    }
    setEditingClient({
      id: client.id,
      name: client.name,
      clientCode: client.clientCode || "",
      description: client.description || "",
      targets: custom.targets || [],
      amc: custom.amc,
      seo: custom.seo,
      status: custom.status,
      revamp: custom.revamp,
      tagIds: client.tags?.map((t: any) => t.tagId) || []
    });
    setIsEditOpen(true);
  };

  const handleSaveTargets = async () => {
    if (!editingClient) return;

    if (editingClient.targets) {
      for (const t of editingClient.targets) {
        if (!t.name || !t.name.trim()) {
          toast.error("Target name cannot be empty");
          return;
        }
        if (t.value < 0) {
          toast.error("Target value cannot be negative");
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const customMeta = {
        amc: editingClient.amc,
        seo: editingClient.seo,
        status: editingClient.status,
        revamp: editingClient.revamp,
        targets: editingClient.targets
      };

      const body = {
        name: editingClient.name,
        clientCode: editingClient.clientCode || undefined,
        description: editingClient.description,
        notes: JSON.stringify(customMeta),
        tagIds: editingClient.tagIds
      };

      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success("Weekly targets updated successfully");
      setIsEditOpen(false);
      setEditingClient(null);
      
      // Update local clients array
      const updatedRes = await fetch("/api/clients");
      const updatedJson = await updatedRes.json();
      if (updatedJson.success) {
        setClients(updatedJson.data);
      }
      
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to update targets");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">
            {filterBrand?.toUpperCase() === "FC" && "Football Counter Clients"}
            {filterBrand?.toUpperCase() === "KW" && "Kodewise Clients"}
            {!filterBrand && "All Clients"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review weekly production quotas, target values, and custom deliverables.
          </p>
        </div>
        <Button onClick={handleOpenAddClient} className="bg-slate-900 text-white hover:bg-slate-800">
          ＋ Add Client
        </Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-100">
              <TableHead className="w-16"></TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Client Code</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead colSpan={2}>Weekly Targets Mapped</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((c) => {
              let targets: any[] = [];
              if (c.notes) {
                try {
                  const parsed = JSON.parse(c.notes);
                  if (parsed.targets) targets = parsed.targets;
                  else {
                    if (parsed.post > 0) targets.push({ name: "post", value: parsed.post });
                    if (parsed.reel > 0) targets.push({ name: "reel", value: parsed.reel });
                    if (parsed.customTargetName && parsed.customTargetValue > 0) {
                      targets.push({ name: parsed.customTargetName, value: parsed.customTargetValue });
                    }
                  }
                } catch (e) {}
              }

              const brandTag = c.tags?.map((t: any) => t.tag?.name).join(", ") || "-";

              return (
                <TableRow key={c.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-xs">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    <Link href={`/tl/clients/${c.id}`} className="hover:underline hover:text-indigo-600 transition-colors">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-500 font-bold">{c.clientCode || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium">
                      {brandTag}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive !== false ? "default" : "outline"} className={c.isActive !== false ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}>
                      {c.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell colSpan={2} className="py-2">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {targets.map((t: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-gray-700 bg-gray-50 border-gray-200 capitalize font-medium">
                          {t.value} {t.name}(s)
                        </Badge>
                      ))}
                      {targets.length === 0 && <span className="text-xs text-gray-400">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(c)}
                        className="border-indigo-100 text-indigo-650 bg-indigo-50/20 hover:bg-indigo-50"
                      >
                        Adjust Targets
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditClient(c)}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(c)}
                        className={c.isActive !== false
                          ? "border-amber-250 text-amber-700 hover:bg-amber-50"
                          : "border-emerald-250 text-emerald-700 hover:bg-emerald-50"
                        }
                      >
                        {c.isActive !== false ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-gray-400">
                  No clients found under this brand.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Target Adjust Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading">
              Adjust Targets: {editingClient?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {/* List of current targets */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold block mb-1">Active Weekly Targets</Label>
              {editingClient?.targets && editingClient.targets.length > 0 ? (
                <div className="space-y-2 max-h-[180px] overflow-y-auto border p-2.5 rounded-lg bg-gray-50/50">
                  {editingClient.targets.map((t: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center justify-between">
                      <span className="capitalize text-xs font-semibold text-gray-700 min-w-[120px] truncate">
                        {t.name}
                      </span>
                      <div className="flex gap-1.5 items-center">
                        <Input
                          type="number"
                          className="h-8 w-20 text-center"
                          value={t.value}
                          onChange={(e) => {
                            const newTargets = [...editingClient.targets];
                            newTargets[index].value = Number(e.target.value);
                            setEditingClient({ ...editingClient, targets: newTargets });
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                          onClick={() => {
                            const newTargets = editingClient.targets.filter((_: any, i: number) => i !== index);
                            setEditingClient({ ...editingClient, targets: newTargets });
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center border border-dashed rounded-lg">No active targets defined.</p>
              )}
            </div>

            {/* Add deliverable inputs */}
            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs uppercase tracking-wider text-gray-400 block font-bold">Add Deliverable Type</Label>
              <div className="flex gap-2">
                <Input
                  id="new-target-name"
                  placeholder="e.g. shoot, post, reel"
                  className="h-8 flex-1"
                />
                <Input
                  id="new-target-value"
                  type="number"
                  placeholder="Value"
                  className="h-8 w-20 text-center"
                  defaultValue="0"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const nameInput = document.getElementById("new-target-name") as HTMLInputElement;
                    const valueInput = document.getElementById("new-target-value") as HTMLInputElement;
                    const val = Number(valueInput?.value) || 0;
                    const name = nameInput?.value?.trim()?.toLowerCase();

                    if (!name) {
                      toast.error("Target name is required");
                      return;
                    }

                    if (editingClient.targets.some((t: any) => t.name === name)) {
                      toast.error(`Target "${name}" already exists`);
                      return;
                    }

                    const newTargets = [...editingClient.targets, { name, value: val }];
                    setEditingClient({ ...editingClient, targets: newTargets });
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveTargets} disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800">
              {isSaving ? "Saving..." : "Save Targets"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Dialog */}
      <ClientDialog
        isOpen={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        editingClient={editingClient}
        setEditingClient={setEditingClient}
        clientCompanyType={clientCompanyType}
        onSave={handleSaveClient}
      />
    </div>
  );
}
