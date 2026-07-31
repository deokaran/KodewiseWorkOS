"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Upload,
  Clock,
  Building2,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Palmtree,
  Award
} from "lucide-react";
import { submitProfileDraftAction } from "@/actions/profile";

interface ProfileClientProps {
  user: any;
  draft: any;
  isTl: boolean;
}

export function ProfileClient({ user, draft, isTl }: ProfileClientProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user.name || "",
    personalEmail: user.personalEmail || "",
    mobileNumber: user.mobileNumber || "",
    aadhaarNumber: user.aadhaarNumber || "",
    dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
    photoBase64: "",
    photoMimeType: "",
    aadhaarPhotoBase64: "",
    aadhaarPhotoMimeType: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "photo" | "aadhaar") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      if (field === "photo") {
        setFormData(prev => ({ ...prev, photoBase64: base64String, photoMimeType: file.type }));
        setPhotoPreview(reader.result as string);
      } else {
        setFormData(prev => ({ ...prev, aadhaarPhotoBase64: base64String, aadhaarPhotoMimeType: file.type }));
        setAadhaarPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await submitProfileDraftAction(formData);
      if (!res.success) throw new Error(res.error);
      toast.success("Profile edit submitted for TL approval");
      setIsEditDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit draft");
    } finally {
      setLoading(false);
    }
  };

  // Profile Photo Source determination
  const profilePhotoUrl = draft?.photo
    ? `/api/users/${user.id}/draft-photo?t=${new Date(draft.updatedAt).getTime()}`
    : user.photo
      ? `/api/users/${user.id}/photo?t=${new Date(user.updatedAt).getTime()}`
      : null;

  // Aadhaar Photo Source determination
  const aadhaarPhotoUrl = draft?.aadhaarPhoto
    ? `/api/users/${user.id}/draft-aadhaar?t=${new Date(draft.updatedAt).getTime()}`
    : user.aadhaarPhoto
      ? `/api/users/${user.id}/aadhaar?t=${new Date(user.updatedAt).getTime()}`
      : null;

  return (
    <div className="space-y-6">
      {/* Pending Draft Notification */}
      {draft && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm animate-in slide-in-from-top duration-200">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-800 text-sm">Updates Pending Approval</h4>
            <p className="text-xs text-amber-700 font-medium">
              You submitted modifications to your profile. These edits are draft and won&apos;t be finalized until a Team Leader approves.
            </p>
            <div className="mt-2 text-xs border-t border-amber-100 pt-2 flex flex-wrap gap-x-4 gap-y-1 text-amber-800">
              {draft.name && <span>• Name: <strong className="underline">{draft.name}</strong></span>}
              {draft.personalEmail && <span>• Personal Email: <strong className="underline">{draft.personalEmail}</strong></span>}
              {draft.mobileNumber && <span>• Mobile: <strong className="underline">{draft.mobileNumber}</strong></span>}
              {draft.dob && <span>• DOB: <strong className="underline">{new Date(draft.dob).toLocaleDateString()}</strong></span>}
              {draft.aadhaarNumber && <span>• Aadhaar No: <strong className="underline">•••• •••• {draft.aadhaarNumber.slice(-4)}</strong></span>}
              {draft.photo && <span className="flex items-center gap-1">• Photo: <Badge variant="outline" className="h-4 py-0 text-[9px] bg-amber-100 text-amber-800 border-amber-300">Updated</Badge></span>}
              {draft.aadhaarPhoto && <span className="flex items-center gap-1">• Aadhaar Photo: <Badge variant="outline" className="h-4 py-0 text-[9px] bg-amber-100 text-amber-800 border-amber-300">Updated</Badge></span>}
            </div>
          </div>
        </div>
      )}

      {/* Main Profile Info Panel */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Header decoration */}
        <div className="h-32 relative">
          <div className="absolute right-6 bottom-4">
            <Badge variant="secondary" className="bg-white/95 text-indigo-900 font-bold px-3 py-1 shadow-sm">
              {user.roles?.map((r: string) => r === "TEAM_LEADER" ? "Team Leader" : r === "COLLABORATOR" ? "Collaborator" : "Employee").join(" / ") || "Employee"}
            </Badge>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="p-6 relative">
          {/* Profile Photo absolute/relative wrapper */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-20 mb-6 gap-4">
            <div className="flex items-end gap-4">
              <div className="h-28 w-28 rounded-full border-4 border-white shadow bg-slate-100 overflow-hidden flex-shrink-0 relative">
                {profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePhotoUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <User className="h-12 w-12" />
                  </div>
                )}
                {draft?.photo && (
                  <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 text-center py-0.5 text-[8px] font-bold text-white uppercase tracking-widest">
                    Draft
                  </div>
                )}
              </div>
              <div className="pb-2">
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">{user.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>{user.department?.name || "No Department Assigned"}</span>
                </p>
              </div>
            </div>
            <div className="pb-2">
              <Button onClick={() => setIsEditDialogOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-5">
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 border-t pt-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Contact Details</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Official Email</p>
                    <p className="font-semibold text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border">
                    <Mail className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Personal Email</p>
                    <p className="font-semibold text-gray-900">
                      {draft?.personalEmail
                        ? <span className="text-amber-700 underline font-bold">{draft.personalEmail} (Pending)</span>
                        : user.personalEmail || <span className="text-gray-400 font-normal">Not Set</span>
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border">
                    <Phone className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Mobile Number</p>
                    <p className="font-semibold text-gray-900">
                      {draft?.mobileNumber
                        ? <span className="text-amber-700 underline font-bold">{draft.mobileNumber} (Pending)</span>
                        : user.mobileNumber || <span className="text-gray-400 font-normal">Not Set</span>
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Personal Information</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border">
                    <Calendar className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Date of Birth</p>
                    <p className="font-semibold text-gray-900">
                      {draft?.dob
                        ? <span className="text-amber-700 underline font-bold">{new Date(draft.dob).toLocaleDateString()} (Pending)</span>
                        : user.dob ? new Date(user.dob).toLocaleDateString() : <span className="text-gray-400 font-normal">Not Set</span>
                      }
                    </p>
                  </div>
                </div>

                {/* Aadhaar (Visible to User themselves or a TL) */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border">
                    <FileText className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium">Aadhaar Number</p>
                    <p className="font-semibold text-gray-900">
                      {draft?.aadhaarNumber
                        ? <span className="text-amber-700 underline font-bold">•••• •••• {draft.aadhaarNumber.slice(-4)} (Pending)</span>
                        : user.aadhaarNumber ? `•••• •••• ${user.aadhaarNumber.slice(-4)}` : <span className="text-gray-400 font-normal">Not Set</span>
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aadhaar Photo Proof Display (TL or User self) */}
          {(user.aadhaarPhoto || draft?.aadhaarPhoto) && (
            <div className="mt-8 border-t pt-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span>Aadhaar Photo Proof</span>
              </h4>
              <div className="max-w-md rounded-2xl border p-4 bg-slate-50 flex items-center gap-4 relative overflow-hidden">
                <ImageIcon className="h-10 w-10 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate">Aadhaar Card Document</p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {draft?.aadhaarPhoto ? "Pending approval draft image" : "Verified database upload"}
                  </p>
                </div>
                <a
                  href={aadhaarPhotoUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white border text-gray-800 text-xs font-bold rounded-lg px-3 py-1.5 hover:bg-gray-100 shadow-sm"
                >
                  View File
                </a>
                {draft?.aadhaarPhoto && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white font-bold text-[8px] uppercase px-2 py-0.5 rounded-bl-lg">
                    Draft
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leaves Allowance & Punctuality Streak Card Panel */}
          <div className="mt-8 border-t pt-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-heading">
              <Palmtree className="h-4 w-4 text-indigo-500" />
              <span>Leaves & Punctuality Streak Summary</span>
            </h4>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="p-4 rounded-xl border bg-slate-50/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Paid Leaves</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{(user.allowedPaid ?? 12) - (user.usedPaid ?? 0)} / {user.allowedPaid ?? 12} <span className="text-xs font-medium text-gray-500">days</span></p>
              </div>
              <div className="p-4 rounded-xl border bg-slate-50/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Casual Leaves</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{(user.allowedCasual ?? 8) - (user.usedCasual ?? 0)} / {user.allowedCasual ?? 8} <span className="text-xs font-medium text-gray-500">days</span></p>
              </div>
              <div className="p-4 rounded-xl border bg-slate-50/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Sick Leaves</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{(user.allowedSick ?? 10) - (user.usedSick ?? 0)} / {user.allowedSick ?? 10} <span className="text-xs font-medium text-gray-500">days</span></p>
              </div>
              <div className="p-4 rounded-xl border bg-purple-50/30 border-purple-100 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-purple-600 uppercase flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    <span>Punctuality Streak</span>
                  </p>
                  <p className="text-xl font-bold text-purple-950 mt-1">{user.consecutivePunctualDays ?? 0} / 20 <span className="text-[10px] font-semibold text-purple-650 block leading-none mt-0.5">days on-time</span></p>
                </div>
                <div className="w-full bg-purple-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, ((user.consecutivePunctualDays ?? 0) / 20) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* User Capabilities */}
          <div className="mt-8 border-t pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Assigned Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {user.capabilities?.length > 0 ? (
                user.capabilities.map((cap: any) => (
                  <Badge key={cap.id} variant="outline" className="bg-slate-50 text-gray-700 px-2.5 py-1">
                    {cap.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-400">No capabilities assigned.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <p className="text-xs text-slate-500">
              Modifying these fields submits a request draft for Team Leader approval. Your public profile will update once approved.
            </p>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Personal Email</Label>
                <Input
                  type="email"
                  value={formData.personalEmail}
                  onChange={e => setFormData({ ...formData, personalEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input
                  value={formData.mobileNumber}
                  onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Aadhaar Number (12 digits)</Label>
                <Input
                  value={formData.aadhaarNumber}
                  onChange={e => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                  placeholder="0000 0000 0000"
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="block mb-2 font-bold text-gray-700">Profile Image (Max 2MB)</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <label className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition">
                  <Upload className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Choose Profile Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, "photo")} />
                </label>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="block mb-2 font-bold text-gray-700">Aadhaar Photo Proof (Max 2MB)</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-24 rounded border bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {aadhaarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={aadhaarPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : aadhaarPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={aadhaarPhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <label className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition">
                  <Upload className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Choose Aadhaar Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, "aadhaar")} />
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
                {loading ? "Submitting..." : "Submit Updates"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
