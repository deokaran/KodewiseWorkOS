"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { CombinedDashboardView } from "./components/combined-dashboard-view";
import { FCDashboardView } from "./components/fc-dashboard-view";
import { KodewiseDashboardView } from "./components/kodewise-dashboard-view";
import { ClientDialog } from "./components/client-dialog";
import { LogDialog } from "./components/log-dialog";
import { TargetsDialog } from "./components/targets-dialog";
import { ClientDrawer } from "./components/client-drawer";
import { TaskCreationModal } from "@/components/shared/task-creation-modal";

import {
  DEFAULT_LOGS,
  KW_STEPS
} from "./components/constants";

interface TLDashboardClientProps {
  activeTab?: string;
  initialBrands: any[];
  initialClients: any[];
  initialWorkTypes: any[];
  initialProcessTemplates: any[];
  initialUsers: any[];
}

export function TLDashboardClient({
  activeTab = "combined",
  initialBrands = [],
  initialClients = [],
  initialWorkTypes = [],
  initialProcessTemplates = [],
  initialUsers = []
}: TLDashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = activeTab;

  // --- Persistent Client States ---
  const [kwClients, setKwClients] = useState<any[]>([]);
  const [fcClients, setFcClients] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<Record<string, Record<string, boolean>>>({});
  const [clientChecklistItems, setClientChecklistItems] = useState<Record<string, string[]>>({});

  // Targets
  const [fcMonthlyTarget, setFcMonthlyTarget] = useState(150);
  const [fcWeeklyTarget, setFcWeeklyTarget] = useState(35);

  // --- Modals / Dialogs states ---
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [clientCompanyType, setClientCompanyType] = useState<"KW" | "FC">("KW");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [selectedKwClientDetail, setSelectedKwClientDetail] = useState<any>(null);

  const fetchRealClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const json = await res.json();
      if (json.success) {
        const kw: any[] = [];
        const fc: any[] = [];
        json.data.forEach((c: any) => {
          let custom = { amc: false, seo: false, status: "Working", revamp: "None", post: 3, reel: 2 };
          if (c.notes) {
            try {
              const parsed = JSON.parse(c.notes);
              if (parsed && typeof parsed === "object") {
                custom = { ...custom, ...parsed };
              }
            } catch (e) {
              // Ignore non-json parsing errors
            }
          }
          const clientWithMeta = { ...c, ...custom };

          const isKw = c.tags?.some((t: any) => t.tag?.name === "Kodewise");
          if (isKw) {
            kw.push(clientWithMeta);
          } else {
            fc.push(clientWithMeta);
          }
        });
        setKwClients(kw);
        setFcClients(fc);
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  const fetchRealWorkItems = async () => {
    try {
      const res = await fetch("/api/work-items");
      const json = await res.json();
      if (json.success) {
        const mapped = json.data.map((w: any) => {
          const currentStageName = w.currentStage?.stageTemplate?.name || "Completed";
          const assigneeName = w.currentStage?.assignedUser?.name || "Unassigned";
          
          return {
            id: w.id,
            workNumber: w.workNumber,
            company: w.primaryBrandTag?.name || "Football Counter",
            client: w.client?.name || "None",
            type: w.workType?.name || "Post",
            stageIndex: w.currentStage?.stageTemplate?.order || 0,
            stageName: currentStageName,
            assignee: assigneeName,
            createdDate: new Date(w.createdAt).toISOString().split("T")[0],
            status: w.status === "ACTIVE" ? "Active" : w.status === "COMPLETED" ? "Published" : "Active",
            history: []
          };
        });
        setTickets(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch work items", err);
    }
  };

  // --- Load and Seed States ---
  useEffect(() => {
    const localLogs = localStorage.getItem("studio_track_logs");
    const localChecklists = localStorage.getItem("studio_track_checklists");
    const localFCMonthly = localStorage.getItem("studio_track_target_monthly");
    const localFCWeekly = localStorage.getItem("studio_track_target_weekly");

    setTimeout(() => {
      fetchRealClients();
      fetchRealWorkItems();

      if (localLogs) setLogs(JSON.parse(localLogs));
      else {
        setLogs(DEFAULT_LOGS);
        localStorage.setItem("studio_track_logs", JSON.stringify(DEFAULT_LOGS));
      }

      if (localChecklists) setChecklists(JSON.parse(localChecklists));

      const localCustomChecklists = localStorage.getItem("kw_client_custom_checklists");
      if (localCustomChecklists) setClientChecklistItems(JSON.parse(localCustomChecklists));

      if (localFCMonthly) setFcMonthlyTarget(Number(localFCMonthly));
      if (localFCWeekly) setFcWeeklyTarget(Number(localFCWeekly));
    }, 0);
  }, []);

  const saveLogs = (data: any[]) => {
    setLogs(data);
    localStorage.setItem("studio_track_logs", JSON.stringify(data));
  };

  const saveChecklists = (data: any) => {
    setChecklists(data);
    localStorage.setItem("studio_track_checklists", JSON.stringify(data));
  };

  // --- CRUD Handlers ---

  // Clients
  const handleOpenAddClient = (type: "KW" | "FC") => {
    setClientCompanyType(type);
    setEditingClient({
      id: `new-${Date.now()}`,
      name: "",
      amc: false,
      seo: false,
      status: "Working",
      revamp: "None",
      post: 0,
      reel: 0
    });
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (c: any, type: "KW" | "FC") => {
    setClientCompanyType(type);
    setEditingClient({ ...c });
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!editingClient.name.trim()) {
      toast.error("Client name is required");
      return;
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
    const brandTag = initialBrands.find(b => b.name === brandTagName);
    if (!brandTag) {
      toast.error(`${brandTagName} brand tag not found`);
      return;
    }

    const body = {
      name: editingClient.name,
      description: editingClient.description || `${brandTagName} Client`,
      notes: JSON.stringify(customMeta),
      tagIds: [brandTag.id]
    };

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
      fetchRealClients();
    } catch (err: any) {
      toast.error(err.message || "Failed to save client");
    }
  };

  const handleToggleActiveClient = async (id: string, currentActive: boolean) => {
    try {
      const list = kwClients.concat(fcClients);
      const client = list.find(c => c.id === id);
      if (!client) return;

      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name,
          isActive: !currentActive
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(`Client ${!currentActive ? 'activated' : 'deactivated'} successfully`);
      fetchRealClients();
    } catch (err: any) {
      toast.error(err.message || "Failed to update client status");
    }
  };

  // Work Logs
  const handleOpenAddLog = () => {
    setEditingLog({
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      company: "Kodewise",
      client: kwClients[0]?.name || "Lupin Foundation",
      category: "AMC",
      status: "Done",
      task: "",
      notes: "",
      date: new Date().toISOString().split("T")[0]
    });
    setIsLogModalOpen(true);
  };

  const handleOpenEditLog = (l: any) => {
    setEditingLog({ ...l });
    setIsLogModalOpen(true);
  };

  const handleSaveLog = () => {
    if (!editingLog.task.trim()) {
      toast.error("Task description is required");
      return;
    }

    let updated;
    if (logs.some(x => x.id === editingLog.id)) {
      updated = logs.map(x => (x.id === editingLog.id ? editingLog : x));
      toast.success("Log entry updated");
    } else {
      updated = [...logs, editingLog];
      toast.success("Work log entry recorded");
    }
    saveLogs(updated);
    setIsLogModalOpen(false);
    setEditingLog(null);
  };

  const handleDeleteLog = (id: string) => {
    const updated = logs.filter(x => x.id !== id);
    saveLogs(updated);
    toast.success("Log entry deleted");
  };

  // Target Settings
  const handleSaveTargets = () => {
    localStorage.setItem("studio_track_target_monthly", String(fcMonthlyTarget));
    localStorage.setItem("studio_track_target_weekly", String(fcWeeklyTarget));
    toast.success("Targets updated successfully");
    setIsTargetModalOpen(false);
  };

  // Checklists
  const toggleChecklistStep = (clientId: string, groupName: string, stepText: string) => {
    const key = `${clientId}::${groupName}`;
    const nextChecklists = { ...checklists };
    if (!nextChecklists[key]) nextChecklists[key] = {};
    nextChecklists[key][stepText] = !nextChecklists[key][stepText];
    saveChecklists(nextChecklists);
  };

  const addChecklistItem = (clientId: string, groupName: string, newItemText: string) => {
    if (!newItemText.trim()) return;
    const key = `${clientId}::${groupName}`;
    const currentItems = clientChecklistItems[key] || [...(KW_STEPS[groupName as keyof typeof KW_STEPS] || [])];
    if (currentItems.includes(newItemText)) {
      toast.error("Item already exists");
      return;
    }
    const nextItems = [...currentItems, newItemText.trim()];
    const nextCustom = { ...clientChecklistItems, [key]: nextItems };
    setClientChecklistItems(nextCustom);
    localStorage.setItem("kw_client_custom_checklists", JSON.stringify(nextCustom));
    toast.success("Checklist item added");
  };

  const deleteChecklistItem = (clientId: string, groupName: string, itemText: string) => {
    const key = `${clientId}::${groupName}`;
    const currentItems = clientChecklistItems[key] || [...(KW_STEPS[groupName as keyof typeof KW_STEPS] || [])];
    const nextItems = currentItems.filter(item => item !== itemText);
    const nextCustom = { ...clientChecklistItems, [key]: nextItems };
    setClientChecklistItems(nextCustom);
    localStorage.setItem("kw_client_custom_checklists", JSON.stringify(nextCustom));

    const nextChecklists = { ...checklists };
    if (nextChecklists[key]) {
      delete nextChecklists[key][itemText];
      saveChecklists(nextChecklists);
    }
    toast.success("Checklist item removed");
  };

  const resetChecklist = (clientId: string, groupName: string) => {
    const key = `${clientId}::${groupName}`;

    const nextCustom = { ...clientChecklistItems };
    delete nextCustom[key];
    setClientChecklistItems(nextCustom);
    localStorage.setItem("kw_client_custom_checklists", JSON.stringify(nextCustom));

    const nextChecklists = { ...checklists };
    nextChecklists[key] = {};
    saveChecklists(nextChecklists);
    toast.success("Checklist reset to default");
  };

  const handleEditTicket = (t: any) => {
    router.push(`/tl/work/${t.id}`);
  };

  const publishedFcTicketsCount = tickets.filter(t => t.company === "Football Counter" && t.status === "Published").length || 18;

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex justify-between items-end gap-4 flex-wrap pb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-heading">
            {tab === "combined" && "Combined Dashboard"}
            {tab === "kodewise" && "Kodewise Dashboard"}
            {tab === "fc" && "Football Counter Dashboard"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {tab === "combined" && "Cross-studio operations command dashboard."}
            {tab === "kodewise" && "AMC / SEO project stages, launch readiness checklists, and developer progress."}
            {tab === "fc" && "Target tracking, daily content pipelines, and matchday work logs."}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "fc" && (
            <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => setIsTargetModalOpen(true)}>
              ⚙ Adjust Targets
            </Button>
          )}
          <Button variant="outline" onClick={handleOpenAddLog}>
            ＋ Add Work Log
          </Button>
          <Button variant="default" className="bg-slate-900 text-white" onClick={() => setIsTaskModalOpen(true)}>
            ＋ Add Task
          </Button>
        </div>
      </div>

      {tab === "combined" && (
        <CombinedDashboardView
          kwClients={kwClients}
          fcClients={fcClients}
          tickets={tickets}
          logs={logs}
          fcWeeklyTarget={fcWeeklyTarget}
          publishedFcTicketsCount={publishedFcTicketsCount}
          handleOpenAddClient={handleOpenAddClient}
          handleOpenEditClient={handleOpenEditClient}
          handleToggleActiveClient={handleToggleActiveClient}
          handleOpenEditTicket={handleEditTicket}
          handleOpenEditLog={handleOpenEditLog}
        />
      )}

      {tab === "fc" && (
        <FCDashboardView
          fcWeeklyTarget={fcWeeklyTarget}
          fcMonthlyTarget={fcMonthlyTarget}
          publishedFcTicketsCount={publishedFcTicketsCount}
          tickets={tickets}
          fcClients={fcClients}
          handleOpenAddClient={handleOpenAddClient}
          handleOpenEditClient={handleOpenEditClient}
          handleToggleActiveClient={handleToggleActiveClient}
          handleOpenEditTicket={handleEditTicket}
          handleOpenAddLog={handleOpenAddLog}
          handleOpenEditLog={handleOpenEditLog}
          logs={logs}
          onRefreshClients={fetchRealClients}
        />
      )}

      {tab === "kodewise" && (
        <KodewiseDashboardView
          kwClients={kwClients}
          tickets={tickets}
          logs={logs}
          handleOpenAddClient={handleOpenAddClient}
          handleOpenEditClient={handleOpenEditClient}
          handleToggleActiveClient={handleToggleActiveClient}
          handleOpenEditTicket={handleEditTicket}
          handleOpenAddLog={handleOpenAddLog}
          handleOpenEditLog={handleOpenEditLog}
          setSelectedKwClientDetail={setSelectedKwClientDetail}
        />
      )}

      <ClientDialog
        isOpen={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        editingClient={editingClient}
        setEditingClient={setEditingClient}
        clientCompanyType={clientCompanyType}
        onSave={handleSaveClient}
      />

      <LogDialog
        isOpen={isLogModalOpen}
        onOpenChange={setIsLogModalOpen}
        editingLog={editingLog}
        setEditingLog={setEditingLog}
        onSave={handleSaveLog}
        onDelete={handleDeleteLog}
      />

      <TargetsDialog
        isOpen={isTargetModalOpen}
        onOpenChange={setIsTargetModalOpen}
        fcWeeklyTarget={fcWeeklyTarget}
        setFcWeeklyTarget={setFcWeeklyTarget}
        fcMonthlyTarget={fcMonthlyTarget}
        setFcMonthlyTarget={setFcMonthlyTarget}
        onSave={handleSaveTargets}
      />

      <ClientDrawer
        selectedKwClientDetail={selectedKwClientDetail}
        onClose={() => setSelectedKwClientDetail(null)}
        clientChecklistItems={clientChecklistItems}
        checklists={checklists}
        toggleChecklistStep={toggleChecklistStep}
        addChecklistItem={addChecklistItem}
        deleteChecklistItem={deleteChecklistItem}
        resetChecklist={resetChecklist}
      />

      <TaskCreationModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSuccess={() => {
          fetchRealWorkItems();
        }}
      />
    </div>
  );
}
