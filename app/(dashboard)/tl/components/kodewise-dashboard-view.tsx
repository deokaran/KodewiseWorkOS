"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface KodewiseDashboardViewProps {
  kwClients: any[];
  tickets: any[];
  logs: any[];
  handleOpenAddClient: (type: "KW" | "FC") => void;
  handleOpenEditClient: (client: any, type: "KW" | "FC") => void;
  handleToggleActiveClient: (id: string, currentActive: boolean) => void;
  handleOpenEditTicket: (ticket: any) => void;
  handleOpenAddLog: () => void;
  handleOpenEditLog: (log: any) => void;
  setSelectedKwClientDetail: (client: any) => void;
}

export function KodewiseDashboardView({
  kwClients,
  tickets,
  logs,
  handleOpenAddClient,
  handleOpenEditClient,
  handleToggleActiveClient,
  handleOpenEditTicket,
  handleOpenAddLog,
  handleOpenEditLog,
  setSelectedKwClientDetail,
}: KodewiseDashboardViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left side: list of projects / clients */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Kodewise Portfolios &amp; Revamps</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">AMC</th>
                    <th className="pb-3">SEO</th>
                    <th className="pb-3">Revamp Stage</th>
                    {/* <th className="pb-3 text-right">Actions</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {kwClients.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => setSelectedKwClientDetail(c)}
                    >
                      <td className="py-3 font-semibold text-indigo-700 hover:underline">
                        <span onClick={(e) => e.stopPropagation()}>
                          <Link href={"/tl/clients/" + c.id}>{c.name}</Link>
                        </span>
                      </td>
                      <td className="py-3">{c.amc ? "Yes" : "—"}</td>
                      <td className="py-3">{c.seo ? "Yes" : "—"}</td>
                      <td className="py-3">
                        <Badge variant="outline">{c.revamp}</Badge>
                      </td>
                      {/* <td className="py-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditClient(c, "KW")}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={c.isActive !== false
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }
                          onClick={() => handleToggleActiveClient(c.id, c.isActive !== false)}
                        >
                          {c.isActive !== false ? "Deactivate" : "Activate"}
                        </Button>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right side: Ongoing tasks & Work logs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ongoing Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets
                .filter((t) => t.company === "Kodewise" && t.status !== "Published")
                .map((t) => (
                  <div key={t.id} className="p-3 border rounded-lg bg-gray-50/50">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-gray-900">{t.client}</span>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {t.type} · Assignee: <strong>{t.assignee}</strong>
                    </p>
                    <div className="flex justify-end gap-1 mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEditTicket(t)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Work Logs (Kodewise)</CardTitle>
              <Button size="sm" variant="ghost" onClick={handleOpenAddLog}>
                ＋ Add Log
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs
                .filter((l) => l.company === "Kodewise")
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
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
