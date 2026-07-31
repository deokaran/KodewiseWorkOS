import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { decrypt } from "@/lib/crypto";
import { ClientEditButton } from "./client-edit-button";

export default async function TLClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("TEAM_LEADER");
  const { id } = await params;

  // Fetch client details
  const client = await prisma.client.findUnique({
    where: { id, deletedAt: null },
    include: {
      tags: { include: { tag: true } },
      workItems: {
        include: { primaryBrandTag: true },
        orderBy: { lastActivityAt: 'desc' }
      }
    }
  });

  if (!client) {
    notFound();
  }

  // Decrypt contact details
  const decryptedContactPerson = decrypt(client.contactPerson);
  const decryptedEmail = decrypt(client.email);
  const decryptedPhone = decrypt(client.phone);
  const decryptedAddress = decrypt(client.address);
  const decryptedWebsite = decrypt(client.website);

  // Parse notes metadata if valid JSON
  let amc = false;
  let seo = false;
  let revamp = "None";
  let status = "Working";
  let targets: Array<{ name: string; value: number }> = [];

  if (client.notes) {
    try {
      const parsed = JSON.parse(client.notes);
      amc = parsed.amc || false;
      seo = parsed.seo || false;
      revamp = parsed.revamp || "None";
      status = parsed.status || "Working";
      if (parsed.targets) {
        targets = parsed.targets;
      } else {
        const arr = [];
        if (parsed.post > 0) arr.push({ name: "post", value: parsed.post });
        if (parsed.reel > 0) arr.push({ name: "reel", value: parsed.reel });
        if (parsed.customTargetName && parsed.customTargetValue > 0) {
          arr.push({ name: parsed.customTargetName, value: parsed.customTargetValue });
        }
        targets = arr;
      }
    } catch {
      // Ignore
    }
  }

  // Calculate Deliveries Stats
  const completedWorkItems = client.workItems.filter(item => item.status === 'COMPLETED');
  const allTimeCount = completedWorkItems.length;

  const now = new Date();

  // Weekly count (last 7 days)
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - 7);
  const weeklyCount = completedWorkItems.filter(item => new Date(item.createdAt) >= startOfWeek).length;

  // Monthly count (last 30 days)
  const startOfMonth = new Date();
  startOfMonth.setDate(now.getDate() - 30);
  const monthlyCount = completedWorkItems.filter(item => new Date(item.createdAt) >= startOfMonth).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Navigation & Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Logo Placeholder */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {client.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <Link 
              href="/tl" 
              className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-indigo-600 hover:underline mb-1"
            >
              ← Back to Dashboard
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-heading leading-tight">{client.name}</h2>
            <p className="text-sm text-gray-500">Comprehensive client profile, contact details, and production pipeline.</p>
          </div>
        </div>
        <ClientEditButton 
          client={client} 
          decrypted={{ contactPerson: decryptedContactPerson, email: decryptedEmail, phone: decryptedPhone, website: decryptedWebsite, address: decryptedAddress }} 
        />
      </div>

      {/* Deliveries Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="pt-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Weekly Deliveries</span>
            <div className="text-3xl font-bold text-gray-900 mt-1">{weeklyCount}</div>
            <p className="text-xs text-gray-500 mt-1">Completed in last 7 days</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="pt-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Monthly Deliveries</span>
            <div className="text-3xl font-bold text-gray-900 mt-1">{monthlyCount}</div>
            <p className="text-xs text-gray-500 mt-1">Completed in last 30 days</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="pt-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">All-Time Deliveries</span>
            <div className="text-3xl font-bold text-gray-900 mt-1">{allTimeCount}</div>
            <p className="text-xs text-gray-500 mt-1">Total completed tickets</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left side: Client profile details card */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg">Client Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Description</span>
                <span className="text-gray-800 font-medium">{client.description || "No description provided."}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Associated Brand(s)</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {client.tags.map(t => (
                    <Badge key={t.tag.id} variant="secondary">{t.tag.name}</Badge>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Services & Status</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 border rounded bg-gray-50/50">
                    <span className="block text-gray-500">AMC Service</span>
                    <span className="font-bold text-gray-800">{amc ? "Active" : "None"}</span>
                  </div>
                  <div className="p-2 border rounded bg-gray-50/50">
                    <span className="block text-gray-500">SEO Service</span>
                    <span className="font-bold text-gray-800">{seo ? "Active" : "None"}</span>
                  </div>
                  <div className="p-2 border rounded bg-gray-50/50 col-span-2">
                    <span className="block text-gray-500">Revamp Stage</span>
                    <span className="font-semibold text-indigo-700">{revamp}</span>
                  </div>
                  {targets.map((t, idx) => (
                    <div key={idx} className="p-2 border rounded bg-gray-50/50">
                      <span className="block text-gray-500 capitalize">{t.name} Target</span>
                      <span className="font-bold text-gray-800">{t.value} {t.name}(s) / week</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Contact Info</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Contact Person</span>
                    <span className="text-gray-800 font-medium">{decryptedContactPerson || "None"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Email</span>
                    <span className="text-gray-800 font-medium">{decryptedEmail || "None"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Phone</span>
                    <span className="text-gray-800 font-medium">{decryptedPhone || "None"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Website</span>
                    {decryptedWebsite ? (
                      <div className="mt-1">
                        <a href={decryptedWebsite.startsWith("http") ? decryptedWebsite : `https://${decryptedWebsite}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                          {decryptedWebsite}
                        </a>
                      </div>
                    ) : "None"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side: Associated Work Items */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work Items & Content Pipeline ({client.workItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {client.workItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Work Number</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.workItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-semibold text-indigo-700">
                            <Link href={`/tl/work/${item.id}`} className="hover:underline">
                              {item.workNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{item.title}</TableCell>
                          <TableCell>{item.primaryBrandTag.name}</TableCell>
                          <TableCell className="capitalize">{item.type.replace('_', ' ').toLowerCase()}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.priority === 'CRITICAL' ? 'destructive' : 'outline'}>
                              {item.priority}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-12">No work items found for this client.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
