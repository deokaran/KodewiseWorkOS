"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  ZoomIn,
  Eye,
  TrendingUp,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Collaboration {
  id: string;
  clientName: string;
  date: string;
  paymentType: string;
  amount: number;
  proofImageMimeType: string;
  published: boolean;
  publishLink: string | null;
  createdAt: string;
  user?: {
    name: string;
  };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CollaborationsClientPageProps {
  userRole: string;
  userCapabilities: string[];
}

export function CollaborationsClientPage({ userRole, userCapabilities }: CollaborationsClientPageProps) {
  const router = useRouter();
  const isTl = userRole === "TEAM_LEADER";
  const hasCollabCapability = userCapabilities.includes("Collaborator");

  // Date States
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12

  // Data States
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to format ISO Date/String into datetime-local value (yyyy-MM-ddThh:mm)
  const toDatetimeLocal = (dateStrOrObj: string | Date) => {
    const date = new Date(dateStrOrObj);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };
  
  // Add / Edit Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [collabDate, setCollabDate] = useState(toDatetimeLocal(today));
  const [paymentType, setPaymentType] = useState("UPI");
  const [customPaymentType, setCustomPaymentType] = useState("");
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [published, setPublished] = useState(false);
  const [publishLink, setPublishLink] = useState("");
  
  // Lightbox Image Preview States
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewClientName, setPreviewClientName] = useState("");

  const fetchCollaborations = async (y: number, m: number) => {
    Promise.resolve().then(() => setIsLoading(true));
    try {
      const res = await fetch(`/api/collaborations?year=${y}&month=${m}`);
      const json = await res.json();
      if (json.success) {
        setCollaborations(json.data);
      } else {
        throw new Error(json.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load collaborations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isTl || hasCollabCapability) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCollaborations(year, month);
    } else {
      Promise.resolve().then(() => setIsLoading(false));
    }
  }, [year, month, isTl, hasCollabCapability]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleOpenAdd = () => {
    setEditingCollab(null);
    setClientName("");
    setCollabDate(toDatetimeLocal(new Date()));
    setPaymentType("UPI");
    setCustomPaymentType("");
    setAmount("");
    setProofFile(null);
    setPublished(false);
    setPublishLink("");
    setIsAddOpen(true);
  };

  const handleOpenEditCollaboration = (collab: Collaboration) => {
    setEditingCollab(collab);
    setClientName(collab.clientName);
    setCollabDate(toDatetimeLocal(collab.date));
    if (["UPI", "Bank Transfer", "Cash", "Cheque"].includes(collab.paymentType)) {
      setPaymentType(collab.paymentType);
      setCustomPaymentType("");
    } else {
      setPaymentType("Other");
      setCustomPaymentType(collab.paymentType);
    }
    setAmount(collab.amount.toString());
    setProofFile(null); // Proof image is optional on edit
    setPublished(collab.published || false);
    setPublishLink(collab.publishLink || "");
    setIsAddOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        toast.error("Proof image exceeds 5MB limit");
        e.target.value = "";
        return;
      }
      setProofFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (!collabDate) {
      toast.error("Collaboration date is required");
      return;
    }
    const finalPaymentType = paymentType === "Other" ? customPaymentType.trim() : paymentType;
    if (!finalPaymentType) {
      toast.error("Payment type is required");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    if (!editingCollab && !proofFile) {
      toast.error("Proof image is required");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("clientName", clientName.trim());
      formData.append("date", collabDate);
      formData.append("paymentType", finalPaymentType);
      formData.append("amount", parsedAmount.toString());
      formData.append("published", published ? "true" : "false");
      formData.append("publishLink", published ? publishLink.trim() : "");
      if (proofFile) {
        formData.append("proofImage", proofFile);
      }

      const isEdit = !!editingCollab;
      const url = isEdit ? `/api/collaborations/${editingCollab.id}` : "/api/collaborations";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(isEdit ? "Collaboration updated successfully" : "Collaboration recorded successfully");
      setIsAddOpen(false);

      // Reset form fields
      setEditingCollab(null);
      setClientName("");
      setCollabDate(toDatetimeLocal(new Date()));
      setPaymentType("UPI");
      setCustomPaymentType("");
      setAmount("");
      setProofFile(null);
      setPublished(false);
      setPublishLink("");

      // Refresh list
      fetchCollaborations(year, month);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save collaboration");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalAmount = collaborations.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-heading">
            Paid Collaborations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Instagram paid promotion logs and record validation.
          </p>
        </div>
        <Button 
          onClick={handleOpenAdd} 
          className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-md shadow-orange-600/10 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Collaboration
        </Button>
      </div>

      {/* Pagination & Filter Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 border rounded-xl shadow-xs gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 border-gray-200">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </Button>
          <span className="text-base font-bold text-gray-900 min-w-[140px] text-center font-heading">
            {MONTHS[month - 1]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 border-gray-200">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white font-medium text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
          >
            {MONTHS.map((mName, idx) => (
              <option key={idx} value={idx + 1}>{mName}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white font-medium text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
          >
            {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map((yVal) => (
              <option key={yVal} value={yVal}>{yVal}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Campaigns This Month</span>
            <span className="text-3xl font-extrabold text-gray-900 font-heading block">{collaborations.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-xs border border-orange-100/50">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block">Monthly Collaboration Revenue</span>
            <span className="text-3xl font-extrabold font-heading block">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/15">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/75">
              <TableHead className="font-semibold text-gray-900">Client Name</TableHead>
              <TableHead className="font-semibold text-gray-900">Promotion Date &amp; Time</TableHead>
              <TableHead className="font-semibold text-gray-900">Payment Type</TableHead>
              <TableHead className="font-semibold text-gray-900">Amount</TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-gray-900">Publish Link</TableHead>
              {isTl && <TableHead className="font-semibold text-gray-900">Uploaded By</TableHead>}
              <TableHead className="font-semibold text-gray-900">Proof of Payment</TableHead>
              {isTl && <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isTl ? 9 : 7} className="h-32 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium text-gray-500">Loading records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : collaborations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isTl ? 9 : 7} className="h-40 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <FileText className="h-8 w-8 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">No collaborations logged</p>
                    <p className="text-xs text-gray-400">No campaigns recorded for {MONTHS[month - 1]} {year}.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              collaborations.map((collab) => (
                <TableRow key={collab.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-semibold text-gray-900">{collab.clientName}</TableCell>
                  <TableCell className="text-gray-600 font-medium">
                    {new Date(collab.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                    <span className="text-xs text-gray-400 block font-normal font-sans">
                      {new Date(collab.date).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium bg-orange-50 text-orange-700 border border-orange-100/50">
                      {collab.paymentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-gray-900 text-base">
                    {formatCurrency(collab.amount)}
                  </TableCell>
                  <TableCell>
                    {collab.published ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-sans">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-gray-500 bg-gray-50 border border-gray-200 font-semibold font-sans">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {collab.publishLink ? (
                      <a 
                        href={collab.publishLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 underline font-sans"
                      >
                        View Post
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </TableCell>
                  {isTl && (
                    <TableCell className="text-gray-600 font-medium">
                      {collab.user?.name || "System/TL"}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        onClick={() => {
                          setPreviewImageUrl(`/api/collaborations/${collab.id}/proof`);
                          setPreviewClientName(collab.clientName);
                        }}
                        className="group relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden cursor-zoom-in hover:shadow-xs transition-shadow"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/collaborations/${collab.id}/proof`}
                          alt="Proof"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-orange-600 gap-1"
                        onClick={() => {
                          setPreviewImageUrl(`/api/collaborations/${collab.id}/proof`);
                          setPreviewClientName(collab.clientName);
                        }}
                      >
                        <Eye className="h-4 w-4" /> View Proof
                      </Button>
                    </div>
                  </TableCell>
                  {isTl && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditCollaboration(collab)}
                        className="border-gray-250 text-gray-700 hover:bg-gray-50 h-8 font-semibold"
                      >
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-[450px] min-h-[50vh] flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-heading text-gray-900">
              {editingCollab ? "Edit Collaboration Record" : "Record Collaboration"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-name" className="text-gray-700 font-semibold">Client Name</Label>
                <Input
                  id="client-name"
                  placeholder="e.g. RedBull India"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="collab-date" className="text-gray-700 font-semibold">Date &amp; Time of Payment</Label>
                  <Input
                    id="collab-date"
                    type="datetime-local"
                    value={collabDate}
                    onChange={(e) => setCollabDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-gray-700 font-semibold">Amount (INR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g. 25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment-type" className="text-gray-700 font-semibold">Payment Type</Label>
                  <select
                    id="payment-type"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white font-medium text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {paymentType === "Other" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                  <Label htmlFor="custom-payment-type" className="text-gray-700 font-semibold">Specify Payment Type</Label>
                  <Input
                    id="custom-payment-type"
                    placeholder="e.g. PayPal"
                    value={customPaymentType}
                    onChange={(e) => setCustomPaymentType(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="published-checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-gray-300 accent-orange-600 h-4 w-4 cursor-pointer"
                />
                <Label htmlFor="published-checkbox" className="text-gray-700 font-semibold cursor-pointer select-none">
                  Published on Instagram
                </Label>
              </div>

              {published && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                  <Label htmlFor="publish-link" className="text-gray-700 font-semibold">Publish Link (Optional)</Label>
                  <Input
                    id="publish-link"
                    type="url"
                    placeholder="e.g. https://instagram.com/p/..."
                    value={publishLink}
                    onChange={(e) => setPublishLink(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="proof-image" className="text-gray-700 font-semibold">
                  Upload Image Proof {editingCollab && "(Optional)"}
                </Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50/50 transition-colors relative cursor-pointer group">
                  <Input
                    id="proof-image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required={!editingCollab}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 text-center pointer-events-none">
                    <Upload className="h-6 w-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    <span className="text-xs font-semibold text-gray-700">
                      {proofFile ? proofFile.name : "Select or drag file"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {editingCollab ? "Leave empty to keep existing proof" : "JPG, PNG or WEBP (Max 5MB)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              >
                {isSaving ? "Saving..." : "Save Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox Preview Dialog */}
      <Dialog open={previewImageUrl !== null} onOpenChange={(open) => {
        if (!open) {
          setPreviewImageUrl(null);
          setPreviewClientName("");
        }
      }}>
        <DialogContent className="max-w-[700px] min-h-[50vh] bg-black/95 border-black/10 text-white p-2 flex flex-col justify-between">
          <DialogHeader className="px-4 pt-4 pb-2 border-b border-white/10 flex-shrink-0">
            <DialogTitle className="text-lg font-bold font-heading text-white">
              Proof of Payment: {previewClientName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {previewImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImageUrl}
                alt="Payment Proof"
                className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-lg border border-white/5"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
