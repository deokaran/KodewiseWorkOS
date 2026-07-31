"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskCreationModal } from "@/components/shared/task-creation-modal";
import { createReminderAction, deleteReminderAction } from "@/actions/reminders";
import { Plus, Bell, Calendar, Trash2, Clock, FileText, User as UserIcon } from "lucide-react";

interface CalendarClientProps {
  user: any;
  events: any[];
  stageDeadlines: any[];
  allStageDeadlines?: any[];
  workItems: any[];
  calendarCells: { date: string | null; isToday: boolean }[];
  monthNames: string[];
  currentMonth: number;
  currentYear: number;
  prevMonth: number;
  prevYear: number;
  nextMonth: number;
  nextYear: number;
  activeBrandName?: string;
  tags: any[];
  clients: any[];
  workTypes: any[];
  processes: any[];
  employees: any[];
  reminders?: any[];
}

export function CalendarClient({
  user,
  events,
  stageDeadlines,
  allStageDeadlines = [],
  workItems = [],
  calendarCells,
  monthNames,
  currentMonth,
  currentYear,
  prevMonth,
  prevYear,
  nextMonth,
  nextYear,
  activeBrandName,
  tags,
  clients,
  workTypes,
  processes,
  employees,
  reminders = []
}: CalendarClientProps) {
  const router = useRouter();

  // Modal/dialog open states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showReminderDetails, setShowReminderDetails] = useState<any | null>(null);
  const [deleteReminderId, setDeleteReminderId] = useState<string | null>(null);

  // Form states
  const [clickedDate, setClickedDate] = useState<Date | null>(null);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDesc, setReminderDesc] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  const handleCellClick = (dateStr: string | null) => {
    if (!dateStr) return;
    setClickedDate(new Date(dateStr));
    setShowChoiceDialog(true);
  };

  const handleSelectAddTask = () => {
    setShowChoiceDialog(false);
    setIsTaskModalOpen(true);
  };

  const handleSelectAddReminder = () => {
    setShowChoiceDialog(false);
    setReminderTitle("");
    setReminderDesc("");
    setReminderTime("09:00");
    setShowReminderDialog(true);
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) {
      toast.error("Reminder title is required.");
      return;
    }
    if (!clickedDate) return;

    setIsSubmittingReminder(true);
    try {
      const [h, m] = reminderTime.split(":");
      const finalDate = new Date(clickedDate);
      finalDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      const res = await createReminderAction({
        title: reminderTitle,
        description: reminderDesc,
        date: finalDate.toISOString(),
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Reminder created successfully!");
      setShowReminderDialog(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create reminder");
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  const handleDeleteReminder = (id: string) => {
    setDeleteReminderId(id);
  };

  const confirmDeleteReminder = async () => {
    if (!deleteReminderId) return;
    try {
      const res = await deleteReminderAction(deleteReminderId);
      if (!res.success) throw new Error(res.error);

      toast.success("Reminder deleted successfully.");
      setShowReminderDetails(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete reminder");
    } finally {
      setDeleteReminderId(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedMonthWorkItems = workItems.filter((item: any) => {
    if (!item.estimatedEnd) return false;
    const ed = new Date(item.estimatedEnd);
    return ed.getMonth() === currentMonth && ed.getFullYear() === currentYear;
  });

  const upcomingTasks = selectedMonthWorkItems
    .filter((item: any) => {
      const ed = new Date(item.estimatedEnd);
      return ed >= today;
    })
    .sort((a: any, b: any) => new Date(a.estimatedEnd).getTime() - new Date(b.estimatedEnd).getTime());

  const pastTasks = selectedMonthWorkItems
    .filter((item: any) => {
      const ed = new Date(item.estimatedEnd);
      return ed < today;
    })
    .sort((a: any, b: any) => new Date(b.estimatedEnd).getTime() - new Date(a.estimatedEnd).getTime());

  return (
    <div className="space-y-6">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">Calendar</h2>
          <p className="text-sm text-gray-500">
            Monitor matchdays, shoot events, and upcoming stage deadlines for {activeBrandName || "your workspace"}.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-gray-200/80">
          <Link 
            href={`/calendar?month=${prevMonth}&year=${prevYear}`}
            className="hover:bg-gray-50 h-8 flex items-center px-3 rounded text-sm text-gray-700 hover:text-gray-900 transition"
          >
            Prev
          </Link>
          <span className="font-semibold text-gray-700 text-sm min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <Link 
            href={`/calendar?month=${nextMonth}&year=${nextYear}`}
            className="hover:bg-gray-50 h-8 flex items-center px-3 rounded text-sm text-gray-700 hover:text-gray-900 transition"
          >
            Next
          </Link>
        </div>
      </div>

      {/* Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Calendar Grid Container */}
        <div className="lg:col-span-3 bg-white border border-gray-200/80 rounded-xl overflow-x-auto">
          <div className="min-w-[750px] lg:min-w-full">
            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 border-b bg-gray-50 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Date cells grid */}
          <div className="grid grid-cols-7 grid-rows-5 auto-rows-fr border-collapse">
            {calendarCells.map((cell, idx) => {
              if (!cell.date) {
                return (
                  <div 
                    key={`empty-${idx}`} 
                    className="min-h-[120px] bg-gray-50/50 border-r border-b border-gray-100 last:border-r-0"
                  />
                );
              }

              const cellDateObj = new Date(cell.date);
              const dayString = cellDateObj.getDate();
              
              // Filter events happening on this cell date
              const dayEvents = events.filter(event => {
                const start = new Date(event.startTime);
                return start.getDate() === cellDateObj.getDate() &&
                  start.getMonth() === cellDateObj.getMonth() &&
                  start.getFullYear() === cellDateObj.getFullYear();
              });

              // Filter stage deadlines on this cell date
              const dayDeadlines = stageDeadlines.filter(stage => {
                if (!stage.deadline) return false;
                const dl = new Date(stage.deadline);
                return dl.getDate() === cellDateObj.getDate() &&
                  dl.getMonth() === cellDateObj.getMonth() &&
                  dl.getFullYear() === cellDateObj.getFullYear();
              });

              // Filter tasks happening on this cell date
              const dayWorkItems = workItems.filter(item => {
                if (!item.estimatedEnd) return false;
                const ed = new Date(item.estimatedEnd);
                return ed.getDate() === cellDateObj.getDate() &&
                  ed.getMonth() === cellDateObj.getMonth() &&
                  ed.getFullYear() === cellDateObj.getFullYear();
              });

              // Filter reminders happening on this cell date
              const dayReminders = reminders.filter(rem => {
                const rd = new Date(rem.date);
                return rd.getDate() === cellDateObj.getDate() &&
                  rd.getMonth() === cellDateObj.getMonth() &&
                  rd.getFullYear() === cellDateObj.getFullYear();
              });

              return (
                <div 
                  key={cell.date} 
                  className={`group min-h-[120px] p-2 border-r border-b border-gray-100 last:border-r-0 flex flex-col justify-between hover:bg-gray-50/30 transition cursor-pointer relative ${
                    cell.isToday ? "bg-blue-100 border-2 border-blue-500 z-10" : ""
                  }`}
                  onClick={() => handleCellClick(cell.date)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-semibold ${
                      cell.isToday 
                        ? "text-blue-700" 
                        : "text-gray-700"
                    }`}>
                      {dayString}
                    </span>
                    {(user.role === "TEAM_LEADER" || user.role === "EMPLOYEE") && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(cell.date);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-indigo-600 hover:text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 rounded transition font-sans"
                      >
                        ＋ Add
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1 max-h-[85px] no-scrollbar">
                    {/* Event Badges */}
                    {dayEvents.map(event => (
                      <div 
                        key={event.id}
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-100 truncate"
                        title={`${event.title} (${event.eventType?.name || "Event"})`}
                      >
                        🎪 {event.title}
                      </div>
                    ))}

                    {/* Reminders Badges */}
                    {dayReminders.map(rem => (
                      <div 
                        key={rem.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReminderDetails(rem);
                        }}
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded font-semibold bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 block truncate"
                        title={`REMINDER: ${rem.title}`}
                      >
                        🔔 {rem.title}
                      </div>
                    ))}

                    {/* Task (WorkItem) Badges */}
                    {dayWorkItems.map(item => {
                      const detailLink = user.role === "TEAM_LEADER"
                        ? `/tl/work/${item.id}`
                        : `/employee/work/${item.id}`;

                      return (
                        <Link 
                          key={item.id}
                          href={detailLink}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] leading-tight px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 block hover:bg-emerald-100 truncate"
                          title={`TASK: ${item.workNumber} - ${item.title} (${item.status})`}
                        >
                          📋 {item.workNumber}: {item.title}
                        </Link>
                      );
                    })}

                    {/* Stage Deadline Badges */}
                    {dayDeadlines.map(stage => {
                      const detailLink = user.role === "TEAM_LEADER"
                        ? `/tl/work/${stage.workItemId}`
                        : `/employee/work/${stage.workItemId}`;

                      return (
                        <Link 
                          key={stage.id}
                          href={detailLink}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-700 border border-rose-100 block hover:bg-rose-100 truncate"
                          title={`DEADLINE: ${stage.workItem.workNumber} - Stage: ${stage.stageTemplate.name}`}
                        >
                          ⚠️ {stage.workItem.workNumber}: {stage.stageTemplate.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Right Side: Aside list */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-heading">
                Tasks for {monthNames[currentMonth]}
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {selectedMonthWorkItems.length} {selectedMonthWorkItems.length === 1 ? 'task' : 'tasks'} found
              </p>
            </div>

            {/* Upcoming Tasks Section */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                Upcoming ({upcomingTasks.length})
              </h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {upcomingTasks.map((item: any) => {
                  const detailLink = user.role === "TEAM_LEADER"
                    ? `/tl/work/${item.id}`
                    : `/employee/work/${item.id}`;

                  const currentStage = item.stages.find((s: any) => s.status === 'READY' || s.status === 'IN_PROGRESS') || item.stages[0];
                  const assigneeName = currentStage?.assignedUser?.name || 'Unassigned';
                  
                  return (
                    <Link
                      key={item.id}
                      href={detailLink}
                      className="block p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-indigo-50/30 hover:border-indigo-100 transition-colors group"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                          {item.workNumber}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                          item.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' :
                          item.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <h5 className="text-[11px] font-semibold text-gray-800 mt-1 line-clamp-1">
                        {item.title}
                      </h5>
                      <div className="flex justify-between items-center text-[9px] text-gray-400 mt-2">
                        <span>
                          📅 {new Date(item.estimatedEnd).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short"
                          })}
                        </span>
                        {user.role === "TEAM_LEADER" && (
                          <span className="truncate max-w-[80px]" title={assigneeName}>
                            👤 {assigneeName.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {upcomingTasks.length === 0 && (
                  <p className="text-[10px] text-gray-400 italic py-1">No upcoming tasks this month.</p>
                )}
              </div>
            </div>

            {/* Past Tasks Section */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Past & History ({pastTasks.length})
              </h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {pastTasks.map((item: any) => {
                  const detailLink = user.role === "TEAM_LEADER"
                    ? `/tl/work/${item.id}`
                    : `/employee/work/${item.id}`;

                  const currentStage = item.stages.find((s: any) => s.status === 'READY' || s.status === 'IN_PROGRESS') || item.stages[0];
                  const assigneeName = currentStage?.assignedUser?.name || 'Unassigned';
                  
                  return (
                    <Link
                      key={item.id}
                      href={detailLink}
                      className="block p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-indigo-50/30 hover:border-indigo-100 transition-colors group opacity-75 hover:opacity-100"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                          {item.workNumber}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                          item.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' :
                          item.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <h5 className="text-[11px] font-semibold text-gray-800 mt-1 line-clamp-1">
                        {item.title}
                      </h5>
                      <div className="flex justify-between items-center text-[9px] text-gray-400 mt-2">
                        <span>
                          📅 {new Date(item.estimatedEnd).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short"
                          })}
                        </span>
                        {user.role === "TEAM_LEADER" && (
                          <span className="truncate max-w-[80px]" title={assigneeName}>
                            👤 {assigneeName.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {pastTasks.length === 0 && (
                  <p className="text-[10px] text-gray-400 italic py-1">No past tasks this month.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Choice Dialog */}
      <Dialog open={showChoiceDialog} onOpenChange={setShowChoiceDialog}>
        <DialogContent className="max-w-[360px] p-6 rounded-3xl border border-gray-150">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-heading text-center">
              Calendar Options
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-gray-500 mt-1">
              Select an action for {clickedDate?.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {user.role === "TEAM_LEADER" && (
              <Button 
                onClick={handleSelectAddTask}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-750 py-6 rounded-2xl flex items-center justify-center gap-2 font-bold cursor-pointer transition shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Spawn New Task
              </Button>
            )}
            <Button 
              onClick={handleSelectAddReminder}
              variant="outline"
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 py-6 rounded-2xl flex items-center justify-center gap-2 font-bold cursor-pointer transition shadow-xs"
            >
              <Bell className="h-4 w-4 text-purple-550" />
              Add Personal Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-[400px] p-6 rounded-3xl border border-gray-150">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2 text-purple-950">
              <Bell className="h-5 w-5 text-purple-600" />
              <span>New Personal Reminder</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Set a private reminder on {clickedDate?.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReminderSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Reminder Title</Label>
              <Input 
                value={reminderTitle}
                onChange={e => setReminderTitle(e.target.value)}
                placeholder="e.g. Prep for kickoff, Send timesheets..."
                className="rounded-xl border-gray-200 focus-visible:ring-indigo-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Target Date</Label>
                <div className="p-2 border rounded-xl bg-gray-50 text-xs text-gray-700 font-medium">
                  {clickedDate?.toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Time</Label>
                <Input 
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="rounded-xl border-gray-200 focus-visible:ring-indigo-600"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Description (Optional)</Label>
              <Textarea 
                value={reminderDesc}
                onChange={e => setReminderDesc(e.target.value)}
                placeholder="Details of the reminder..."
                className="rounded-xl border-gray-200 focus-visible:ring-indigo-600 min-h-[80px]"
              />
            </div>
            <DialogFooter className="pt-2 gap-2 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setShowReminderDialog(false)} disabled={isSubmittingReminder} className="rounded-xl cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingReminder} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer transition">
                {isSubmittingReminder ? "Adding..." : "Save Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reminder Details Dialog */}
      <Dialog open={showReminderDetails !== null} onOpenChange={(open) => !open && setShowReminderDetails(null)}>
        <DialogContent className="max-w-[360px] p-6 rounded-3xl border border-gray-150">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-heading flex items-center gap-2 text-purple-950">
              <Bell className="h-5 w-5 text-purple-600" />
              <span>Personal Reminder</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <h4 className="text-lg font-bold text-gray-955 leading-tight">{showReminderDetails?.title}</h4>
              <p className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span>
                  {showReminderDetails && new Date(showReminderDetails.date).toLocaleString([], {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </p>
            </div>
            {showReminderDetails?.description && (
              <div className="p-3 bg-purple-50/30 border border-purple-100 rounded-xl text-xs text-purple-950 whitespace-pre-wrap font-sans">
                {showReminderDetails.description}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                onClick={() => setShowReminderDetails(null)}
                variant="outline" 
                size="sm"
                className="rounded-xl cursor-pointer"
              >
                Close
              </Button>
              <Button 
                onClick={() => handleDeleteReminder(showReminderDetails.id)}
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Creation Modal */}
      {isTaskModalOpen && clickedDate && (
        <TaskCreationModal 
          open={isTaskModalOpen} 
          onOpenChange={setIsTaskModalOpen} 
          defaultDate={clickedDate.toISOString().split('T')[0]}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={deleteReminderId !== null}
        onOpenChange={(open) => !open && setDeleteReminderId(null)}
        title="Delete Reminder"
        description="Are you sure you want to delete this reminder?"
        onConfirm={confirmDeleteReminder}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
