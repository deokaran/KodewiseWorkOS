"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { requestLeaveAction } from "@/actions/leaves";
import { LeaveType, LeaveRequestStatus } from "@prisma/client";
import { Calendar, CheckCircle2, AlertCircle, Clock, Palmtree, Award, Plus } from "lucide-react";

interface LeavesClientProps {
  user: any;
  leaveRequests: any[];
}

export function LeavesClient({ user, leaveRequests }: LeavesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date") || "";

  const [isSubmitOpen, setIsSubmitOpen] = useState(!!dateParam);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    type: LeaveType.PAID,
    startDate: dateParam,
    endDate: dateParam,
    reason: ""
  });

  const remainingPaid = user.allowedPaid - user.usedPaid;
  const remainingCasual = user.allowedCasual - user.usedCasual;
  const remainingSick = user.allowedSick - user.usedSick;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      toast.error("End date cannot be before start date");
      return;
    }

    setLoading(true);
    try {
      const res = await requestLeaveAction({
        type: formData.type,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason: formData.reason
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Leave request submitted successfully!");
      setIsSubmitOpen(false);
      setFormData({
        type: LeaveType.PAID,
        startDate: "",
        endDate: "",
        reason: ""
      });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  return (
    <div className="space-y-6">
      {/* Leaves Balances Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Paid Leaves */}
        <Card className="border-indigo-100 bg-indigo-50/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 bg-indigo-500/10 rounded-full flex items-center justify-center">
            <Palmtree className="h-8 w-8 text-indigo-500/30" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-indigo-600">Paid Leaves</CardDescription>
            <CardTitle className="text-3xl font-bold font-heading text-indigo-950">{remainingPaid} <span className="text-sm font-medium text-indigo-600">days left</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-medium text-indigo-700/80">
              Allowed: {user.allowedPaid} | Used: {user.usedPaid}
            </p>
          </CardContent>
        </Card>

        {/* Casual Leaves */}
        <Card className="border-emerald-100 bg-emerald-50/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-emerald-500/30" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-600">Casual Leaves</CardDescription>
            <CardTitle className="text-3xl font-bold font-heading text-emerald-950">{remainingCasual} <span className="text-sm font-medium text-emerald-600">days left</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-medium text-emerald-700/80">
              Allowed: {user.allowedCasual} | Used: {user.usedCasual}
            </p>
          </CardContent>
        </Card>

        {/* Sick Leaves */}
        <Card className="border-rose-100 bg-rose-50/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 bg-rose-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-rose-500/30" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-rose-600">Sick Leaves</CardDescription>
            <CardTitle className="text-3xl font-bold font-heading text-rose-950">{remainingSick} <span className="text-sm font-medium text-rose-600">days left</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-medium text-rose-700/80">
              Allowed: {user.allowedSick} | Used: {user.usedSick}
            </p>
          </CardContent>
        </Card>

        {/* Discipline Streak */}
        <Card className="border-purple-100 bg-purple-50/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 bg-purple-500/10 rounded-full flex items-center justify-center">
            <Award className="h-8 w-8 text-purple-500/30 animate-pulse" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-purple-600">Punctuality Streak</CardDescription>
            <CardTitle className="text-3xl font-bold font-heading text-purple-950">{user.consecutivePunctualDays} / 20</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-purple-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (user.consecutivePunctualDays / 20) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] font-semibold text-purple-700 leading-tight">
              Earn +1 Paid Leave by clocking in before 10:20 AM IST for 20 consecutive days!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Application Actions */}
      <div className="flex justify-between items-center pt-2">
        <h3 className="text-lg font-bold text-gray-900 font-sans">Request History</h3>
        <Button onClick={() => setIsSubmitOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Apply for Leave</span>
        </Button>
      </div>

      {/* Leave Application Dialog Form */}
      {isSubmitOpen && (
        <Card className="border border-slate-200 rounded-2xl shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold font-heading">Apply for Leave</CardTitle>
            <CardDescription className="text-xs">Submit a leave request for Team Leader approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Leave Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val: any) => {
                      if (val) setFormData({...formData, type: val as LeaveType});
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LeaveType.PAID}>Paid Leave</SelectItem>
                      <SelectItem value={LeaveType.CASUAL}>Casual Leave</SelectItem>
                      <SelectItem value={LeaveType.SICK}>Sick Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                    className="rounded-xl focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    className="rounded-xl focus-visible:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Reason / Remarks (Optional)</Label>
                <Textarea 
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                  placeholder="Provide context for your leave..."
                  className="rounded-xl focus-visible:ring-indigo-600 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)} disabled={loading} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-indigo-700 text-white font-bold rounded-xl px-5">
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leaves History Table */}
      <div className="border rounded-2xl bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-xs text-gray-500">Leave Type</TableHead>
              <TableHead className="font-bold text-xs text-gray-500">Period</TableHead>
              <TableHead className="font-bold text-xs text-gray-500">Duration</TableHead>
              <TableHead className="font-bold text-xs text-gray-500">Reason</TableHead>
              <TableHead className="font-bold text-xs text-gray-500">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveRequests.map((req) => (
              <TableRow key={req.id} className="hover:bg-slate-50/50">
                <TableCell className="py-3">
                  <Badge variant="outline" className={`font-semibold capitalize ${
                    req.type === LeaveType.PAID ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    req.type === LeaveType.CASUAL ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {req.type.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium text-gray-700">
                  {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-xs font-bold text-gray-900">
                  {calculateDays(req.startDate, req.endDate)} {calculateDays(req.startDate, req.endDate) === 1 ? 'day' : 'days'}
                </TableCell>
                <TableCell className="text-xs text-gray-500 max-w-[200px] truncate" title={req.reason || ""}>
                  {req.reason || <span className="italic text-gray-400">None</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`font-bold flex items-center gap-1.5 w-fit ${
                    req.status === LeaveRequestStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' :
                    req.status === LeaveRequestStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  }`}>
                    {req.status === LeaveRequestStatus.APPROVED && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {req.status === LeaveRequestStatus.REJECTED && <AlertCircle className="h-3.5 w-3.5" />}
                    {req.status === LeaveRequestStatus.PENDING && <Clock className="h-3.5 w-3.5" />}
                    <span>{req.status}</span>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}

            {leaveRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-gray-400 italic">
                  No leave requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
