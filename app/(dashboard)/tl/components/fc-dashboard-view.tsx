"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "./circular-progress";
import { getPipeline } from "./constants";
import { parseClientNotes, serializeClientNotes, WeekdayKey } from "@/lib/client-metadata";
import { toast } from "sonner";
import { ArrowUpRight, Check, Edit2, Info } from "lucide-react";

interface FCDashboardViewProps {
  fcWeeklyTarget: number;
  fcMonthlyTarget: number;
  publishedFcTicketsCount: number;
  tickets: any[];
  fcClients: any[];
  handleOpenAddClient: (type: "KW" | "FC") => void;
  handleOpenEditClient: (client: any, type: "KW" | "FC") => void;
  handleToggleActiveClient: (id: string, currentActive: boolean) => void;
  handleOpenEditTicket: (ticket: any) => void;
  handleOpenAddLog: () => void;
  handleOpenEditLog: (log: any) => void;
  logs: any[];
  onRefreshClients?: () => void;
}

export function FCDashboardView({
  fcWeeklyTarget,
  fcMonthlyTarget,
  publishedFcTicketsCount,
  tickets,
  fcClients,
  handleOpenAddClient,
  handleOpenEditClient,
  handleToggleActiveClient,
  handleOpenEditTicket,
  handleOpenAddLog,
  handleOpenEditLog,
  logs,
  onRefreshClients,
}: FCDashboardViewProps) {
  
  // Calculate total weekly target based on individual client targets
  const totalWeeklyTarget = fcClients.reduce((sum, c) => {
    const meta = parseClientNotes(c.notes);
    return sum + meta.targets.reduce((tSum, t) => tSum + (t.value || 0), 0);
  }, 0);

  // Toggle schedule cell type on-the-fly
  const handleToggleCell = async (client: any, dayKey: WeekdayKey) => {
    const meta = parseClientNotes(client.notes);
    const schedule = { ...meta.weeklySchedule };
    const currentDayTargets = schedule[dayKey] || [];

    const hasPost = currentDayTargets.some((t: any) => t.name === "post");
    const hasReel = currentDayTargets.some((t: any) => t.name === "reel");

    let nextVal: string;
    if (!hasPost && !hasReel) {
      nextVal = "Post";
    } else if (hasPost && !hasReel) {
      nextVal = "Reel";
    } else if (!hasPost && hasReel) {
      nextVal = "Both";
    } else {
      nextVal = "-";
    }

    const nextTargets: any[] = [];
    if (nextVal === "Post") {
      nextTargets.push({ name: "post", value: 1 });
    } else if (nextVal === "Reel") {
      nextTargets.push({ name: "reel", value: 1 });
    } else if (nextVal === "Both") {
      nextTargets.push({ name: "post", value: 1 }, { name: "reel", value: 1 });
    }

    schedule[dayKey] = nextTargets;

    // Build serialized notes and save
    const newNotes = serializeClientNotes({
      ...meta,
      weeklySchedule: schedule
    });

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name,
          notes: newNotes
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(`Updated schedule for ${client.name} on ${dayKey.toUpperCase()}`);
      if (onRefreshClients) {
        onRefreshClients();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update schedule");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Combined Weekly Target Card */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xs flex justify-between items-center max-w-xl">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-85 block">Combined Weekly Target</span>
          <span className="text-3xl font-extrabold font-heading mt-1 block">{totalWeeklyTarget} Deliverables / Week</span>
          <p className="text-xs mt-1.5 opacity-75">Accumulated weekly targets of all active Football Counter clients.</p>
        </div>
        <CircularProgress value={publishedFcTicketsCount} max={totalWeeklyTarget || 1} color="#ffffff" size={64} />
      </div>

      {/* 2. Weekly Post / Reel Schedule Grid */}
      <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900">Weekly post / reel schedule per client</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Click on any cell to toggle/cycle: - &rarr; Post &rarr; Reel &rarr; Both &rarr; -</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-gray-400 font-semibold text-xs">
                  <th className="text-left py-3 px-4 font-bold text-gray-700 min-w-[160px]">CLIENT</th>
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                    <th key={day} className="text-center py-3 px-2 font-bold min-w-[100px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fcClients.map((client) => {
                  const meta = parseClientNotes(client.notes);
                  const schedule = meta.weeklySchedule;

                  return (
                    <tr key={client.id} className="border-b hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-950">{client.name}</td>
                      {(["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as WeekdayKey[]).map((dayKey) => {
                        const dayTargets = schedule[dayKey] || [];
                        const hasPost = dayTargets.some((t: any) => t.name === "post");
                        const hasReel = dayTargets.some((t: any) => t.name === "reel");

                        let display = "-";
                        let cellClass = "bg-slate-50/50 text-slate-350 hover:bg-slate-100 hover:text-slate-500 border border-transparent";

                        if (hasPost && hasReel) {
                          display = "Both";
                          cellClass = "bg-purple-50 text-purple-700 border border-purple-200 font-semibold";
                        } else if (hasPost) {
                          display = "Post";
                          cellClass = "bg-orange-50/80 text-orange-700 border border-orange-200 font-semibold";
                        } else if (hasReel) {
                          display = "Reel";
                          cellClass = "bg-blue-50/80 text-blue-700 border border-blue-200 font-semibold";
                        }

                        return (
                          <td key={dayKey} className="py-3 px-2 text-center">
                            <button
                              onClick={() => handleToggleCell(client, dayKey)}
                              className={`w-full py-1.5 rounded-lg text-xs transition-all hover:scale-[1.03] cursor-pointer ${cellClass}`}
                            >
                              {display}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-start gap-2 bg-slate-50 border p-3 rounded-xl mt-4 text-xs text-gray-500">
            <Info className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p>
              Each client gets either a Post or a Reel per day, never both &mdash; except YFC &amp; FC who need daily coverage of both.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabular Targets Overview */}
      <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900">Client Retainer Targets Overview</CardTitle>
          <Button size="sm" onClick={() => handleOpenAddClient("FC")} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
            ＋ Add Client
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-gray-400 font-semibold text-xs text-left bg-slate-50/20">
                  <th className="py-3.5 px-6 font-bold text-gray-700">CLIENT</th>
                  <th className="py-3.5 px-6 font-bold text-gray-700 text-center">WEEKLY POSTS</th>
                  <th className="py-3.5 px-6 font-bold text-gray-700 text-center">WEEKLY REELS</th>
                  {/* <th className="py-3.5 px-6 font-bold text-gray-700 text-right">ACTIONS</th> */}
                </tr>
              </thead>
              <tbody>
                {fcClients.map((c) => {
                  const meta = parseClientNotes(c.notes);
                  const postsTarget = meta.targets.find(t => t.name === "post")?.value || 0;
                  const reelsTarget = meta.targets.find(t => t.name === "reel")?.value || 0;

                  return (
                    <tr key={c.id} className="border-b hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-950">{c.name}</td>
                      <td className="py-4 px-6 text-center text-gray-700 font-medium">{postsTarget}</td>
                      <td className="py-4 px-6 text-center text-gray-700 font-medium">{reelsTarget}</td>
                      {/* <td className="py-4 px-6 text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-gray-600 hover:text-orange-600" 
                          onClick={() => handleOpenEditClient(c, "FC")}
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-8 ${
                            c.isActive !== false
                              ? "text-amber-700 hover:text-amber-800"
                              : "text-emerald-700 hover:text-emerald-800"
                          }`}
                          onClick={() => handleToggleActiveClient(c.id, c.isActive !== false)}
                        >
                          {c.isActive !== false ? "Deactivate" : "Activate"}
                        </Button>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Feeds Grid (3-column layout) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 pt-4">
        {/* His Tasks column */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-lg">His Tasks (Assigned to TL / Admin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets
              .filter(
                (t) => t.company === "Football Counter" && t.assignee === "Loknath Epili" && t.status !== "Published"
              )
              .map((t) => (
                <div key={t.id} className="p-3 border rounded-lg bg-orange-50/30 border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{t.client}</span>
                    <Badge>{t.type}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Current Stage: {getPipeline(t.type)[t.stageIndex] || "Published"}
                  </div>
                  <div className="flex justify-end gap-1 mt-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditTicket(t)}>
                      Edit Task
                    </Button>
                  </div>
                </div>
              ))}
            {tickets.filter(
              (t) => t.company === "Football Counter" && t.assignee === "Loknath Epili" && t.status !== "Published"
            ).length === 0 && <p className="text-sm text-gray-400 text-center py-6">No tasks assigned to your role.</p>}
          </CardContent>
        </Card> */}

        {/* Ongoing Tasks column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ongoing Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets
              .filter((t) => t.company === "Football Counter" && t.status !== "Published")
              .map((t) => (
                <div key={t.id} className="p-3 border rounded-lg bg-gray-50/50">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-900">{t.client}</span>
                    <Badge variant="outline">{t.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.type} · Assignee: <strong>{t.assignee}</strong>
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mt-2">
                    Stage: {getPipeline(t.type)[t.stageIndex] || "Published"}
                  </p>
                  <div className="flex justify-end gap-1 mt-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditTicket(t)}>
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            {tickets.filter((t) => t.company === "Football Counter" && t.status !== "Published").length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No ongoing tasks.</p>
            )}
          </CardContent>
        </Card>

        {/* Work Logs column */}
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Work Logs (FC)</CardTitle>
            <Button size="sm" variant="ghost" onClick={handleOpenAddLog}>
              ＋ Add Log
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs
              .filter((l) => l.company === "Football Counter")
              .map((l) => (
                <div key={l.id} className="p-3 border rounded-lg bg-gray-50/50 text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-gray-900">{l.client}</span>
                    <span className="text-xs text-gray-400">{l.date}</span>
                  </div>
                  <div className="text-xs text-gray-700 mt-1">{l.task}</div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {l.category}
                    </Badge>
                    <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={() => handleOpenEditLog(l)}>
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            {logs.filter((l) => l.company === "Football Counter").length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No logs recorded.</p>
            )}
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
