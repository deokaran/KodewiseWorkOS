"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CircularProgress } from "./circular-progress";
import { getPipeline } from "./constants";

interface CombinedDashboardViewProps {
  kwClients: any[];
  fcClients: any[];
  tickets: any[];
  logs: any[];
  fcWeeklyTarget: number;
  publishedFcTicketsCount: number;
  handleOpenAddClient: (type: "KW" | "FC") => void;
  handleOpenEditClient: (client: any, type: "KW" | "FC") => void;
  handleToggleActiveClient: (id: string, currentActive: boolean) => void;
  handleOpenEditTicket: (ticket: any) => void;
  handleOpenEditLog: (log: any) => void;
}

export function CombinedDashboardView({
  kwClients,
  fcClients,
  tickets,
  logs,
  fcWeeklyTarget,
  publishedFcTicketsCount,
  handleOpenAddClient,
  handleOpenEditClient,
  handleToggleActiveClient,
  handleOpenEditTicket,
  handleOpenEditLog,
}: CombinedDashboardViewProps) {
  // Slice to 5 active clients each as requested
  const activeKwClients = kwClients.filter((c) => c.isActive !== false);
  const activeFcClients = fcClients.filter((c) => c.isActive !== false);
  const visibleKwClients = activeKwClients.slice(0, 5);
  const visibleFcClients = activeFcClients.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Quick Metrics */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="pt-6">
            <div className="text-sm font-semibold uppercase tracking-wider text-gray-500">Kodewise Clients</div>
            <div className="text-4xl font-bold text-gray-900 font-heading mt-2">{activeKwClients.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              {activeKwClients.filter((c) => c.status?.startsWith("Beta")).length} active beta stages
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wider text-gray-500">Football Counter Clients</div>
              <div className="text-4xl font-bold text-gray-900 font-heading mt-2">{activeFcClients.length}</div>
              <div className="text-xs text-gray-500 mt-1">
                Targeting {activeFcClients.reduce((sum, c) => sum + (c.post || 0) + (c.reel || 0), 0)} weekly posts
              </div>
            </div>
            <CircularProgress value={publishedFcTicketsCount} max={fcWeeklyTarget} color="#f97316" size={54} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-semibold uppercase tracking-wider text-gray-500">Active Tasks</div>
            <div className="text-4xl font-bold text-gray-900 font-heading mt-2">
              {tickets.filter((t) => t.status !== "Published").length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {tickets.filter((t) => t.status === "Reworking").length} marked for rework
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-semibold uppercase tracking-wider text-gray-500">Work Logs Recorded</div>
            <div className="text-4xl font-bold text-gray-900 font-heading mt-2">{logs.length}</div>
            <div className="text-xs text-gray-500 mt-1">Daily updates recorded by team</div>
          </CardContent>
        </Card> */}
      </div>

      {/* Double column grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left side: combined client lists limited to 5-5 */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Kodewise Clients</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-3 pl-6">Client</th>
                    <th className="p-3">AMC</th>
                    <th className="p-3">SEO</th>
                    <th className="p-3">Status</th>
                    {/* <th className="p-3 text-right pr-6">Actions</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {visibleKwClients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3 pl-6 font-semibold text-indigo-750 hover:underline">
                        <Link href={"/tl/clients/" + c.id}>{c.name}</Link>
                      </td>
                      <td className="py-3">
                        <span className={c.amc ? "text-emerald-600 font-bold" : "text-gray-300"}>
                          {c.amc ? "Yes" : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={c.seo ? "text-emerald-600 font-bold" : "text-gray-300"}>
                          {c.seo ? "Yes" : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={c.status?.startsWith("Working") ? "secondary" : "outline"}
                          className={
                            c.status?.startsWith("Working")
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : ""
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      {/* <td className="py-3 text-right pr-6 space-x-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleOpenEditClient(c, "KW")}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-7 text-xs ${
                            c.isActive !== false
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                          onClick={() => handleToggleActiveClient(c.id, c.isActive !== false)}
                        >
                          {c.isActive !== false ? "Deactivate" : "Activate"}
                        </Button>
                      </td> */}
                    </tr>
                  ))}
                  {visibleKwClients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                        No Kodewise clients mapped.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
            {activeKwClients.length > 5 && (
              <div className="p-3 bg-gray-50/50 border-t flex justify-end px-6">
                <Link href="/tl/clients" className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-1.5 border border-transparent transition">
                  View More Clients ({activeKwClients.length - 5} remaining)
                </Link>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Football Counter Clients</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-3 pl-6">Client</th>
                    <th className="p-3">Weekly Posts</th>
                    <th className="p-3">Weekly Reels</th>
                    {/* <th className="p-3 text-right pr-6">Actions</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {visibleFcClients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3 pl-6 font-semibold text-indigo-750 hover:underline">
                        <Link href={"/tl/clients/" + c.id}>{c.name}</Link>
                      </td>
                      <td className="py-3 text-gray-600 font-medium">{c.post || 0} posts</td>
                      <td className="py-3 text-gray-600 font-medium">{c.reel || 0} reels</td>
                      {/* <td className="py-3 text-right pr-6 space-x-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleOpenEditClient(c, "FC")}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-7 text-xs ${
                            c.isActive !== false
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                          onClick={() => handleToggleActiveClient(c.id, c.isActive !== false)}
                        >
                          {c.isActive !== false ? "Deactivate" : "Activate"}
                        </Button>
                      </td> */}
                    </tr>
                  ))}
                  {visibleFcClients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400 text-xs">
                        No Football Counter clients mapped.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
            {activeFcClients.length > 5 && (
              <div className="p-3 bg-gray-50/50 border-t flex justify-end px-6">
                <Link href="/tl/clients" className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-1.5 border border-transparent transition">
                  View More Clients ({activeFcClients.length - 5} remaining)
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right side: Needs attention & Recent activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Needs Attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets
                .filter((t) => t.status === "Reworking" || t.status === "Active")
                .map((t) => {
                  const pipe = getPipeline(t.type);
                  const currentStage = pipe[t.stageIndex] || "Published";
                  return (
                    <div key={t.id} className="p-3 border rounded-lg bg-gray-50/50">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-semibold text-gray-900">{t.client}</div>
                        <Badge
                          variant="outline"
                          className={
                            t.status === "Reworking"
                              ? "border-red-200 bg-red-50 text-red-800"
                              : "border-indigo-200 bg-indigo-50 text-indigo-800"
                          }
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t.type} · Assignee: <strong className="text-gray-700">{t.assignee}</strong>
                      </div>
                      <div className="text-xs font-semibold text-gray-700 mt-2">Stage: {currentStage}</div>
                      <div className="flex justify-end gap-1 mt-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditTicket(t)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              {tickets.filter((t) => t.status === "Reworking" || t.status === "Active").length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No pending action items.</p>
              )}
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Work Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logs.slice(0, 5).map((l) => (
                <div key={l.id} className="text-sm border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-indigo-750">{l.client}</span>
                    <span className="text-xs text-gray-400">{l.date}</span>
                  </div>
                  <div className="text-gray-800 mt-1 text-xs">{l.task}</div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {l.category}
                    </Badge>
                    <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={() => handleOpenEditLog(l)}>
                      Edit Log
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
