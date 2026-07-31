"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, X, CheckCircle, HelpCircle, Edit2, Plus, Palmtree } from "lucide-react";
import { getMonthlyAttendanceAction } from "@/actions/attendance";
import { getMonthlyPendingRequestsAction, createAttendanceRequestAction } from "@/actions/attendance-requests";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface AttendanceLog {
  id: string;
  clockIn: string;
  clockOut: string | null;
  workLocation?: "IN_OFFICE" | "WORK_FROM_HOME";
  createdAt: string;
}

interface AttendanceRequest {
  id: string;
  attendanceId: string | null;
  type: "CREATE" | "UPDATE";
  clockIn: string;
  clockOut: string | null;
  workLocation: "IN_OFFICE" | "WORK_FROM_HOME";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  createdAt: string;
}

interface AttendanceCalendarProps {
  userId?: string;
}

export function AttendanceCalendar({ userId }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // State to manage clicked date details modal
  const [selectedDay, setSelectedDay] = useState<{
    dayNum: number;
    logs: AttendanceLog[];
    date: Date;
  } | null>(null);

  // Request Form States
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    clockInTime: "09:00",
    clockOutTime: "17:00",
    workLocation: "IN_OFFICE" as "IN_OFFICE" | "WORK_FROM_HOME",
    reason: "",
    attendanceId: ""
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Fetch attendance records for the selected month
  useEffect(() => {
    async function fetchAttendance() {
      setLoading(true);
      try {
        const [res, resReq] = await Promise.all([
          getMonthlyAttendanceAction(year, month + 1, userId),
          getMonthlyPendingRequestsAction(year, month + 1, userId)
        ]);
        if (res.success && res.data) {
          setLogs(res.data);
        }
        if (resReq.success && resReq.data) {
          setRequests(resReq.data);
        }
      } catch (err) {
        console.error("Error fetching attendance history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, [year, month, userId, refreshKey]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setShowRequestForm(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setShowRequestForm(false);
  };

  // Helper to generate the day grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group logs by day of the month
  const logsByDay: { [day: number]: AttendanceLog[] } = {};
  logs.forEach((log) => {
    const logDate = new Date(log.clockIn);
    if (logDate.getFullYear() === year && logDate.getMonth() === month) {
      const dayNum = logDate.getDate();
      if (!logsByDay[dayNum]) {
        logsByDay[dayNum] = [];
      }
      logsByDay[dayNum].push(log);
    }
  });

  const getDayDetails = (dayNum: number) => {
    const dayDate = new Date(year, month, dayNum);
    
    // Normalize today's date for comparison
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const isFuture = dayDate > todayDate;
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6; // 0 is Sunday, 6 is Saturday

    const dayLogs = logsByDay[dayNum] || [];
    const hasLogs = dayLogs.length > 0;

    let status: "green" | "blue" | "red" | "grey" | "future" = "future";

    if (hasLogs) {
      const hasInOffice = dayLogs.some(log => !log.workLocation || log.workLocation === "IN_OFFICE");
      if (hasInOffice) {
        status = "green";
      } else {
        status = "blue";
      }
    } else if (isFuture) {
      status = "future";
    } else if (isWeekend) {
      status = "grey";
    } else {
      status = "red"; // Absent weekday
    }

    return {
      status,
      dayLogs,
      dayDate,
      isWeekend
    };
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const handleRequestSubmit = async () => {
    if (!requestFormData.reason) {
      toast.error("Please specify a reason for this manual attendance entry request.");
      return;
    }

    setSubmittingRequest(true);

    try {
      const inDate = new Date(selectedDay!.date);
      const [inH, inM] = requestFormData.clockInTime.split(":");
      inDate.setHours(parseInt(inH), parseInt(inM), 0, 0);

      const outDate = new Date(selectedDay!.date);
      const [outH, outM] = requestFormData.clockOutTime.split(":");
      outDate.setHours(parseInt(outH), parseInt(outM), 0, 0);

      const res = await createAttendanceRequestAction({
        clockIn: inDate.toISOString(),
        clockOut: outDate.toISOString(),
        workLocation: requestFormData.workLocation,
        reason: requestFormData.reason,
        attendanceId: requestFormData.attendanceId || undefined
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Manual attendance request submitted!");
      setShowRequestForm(false);
      setRefreshKey(prev => prev + 1);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm max-w-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Attendance Calendar</h3>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border p-1 rounded-xl">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-white hover:text-indigo-650 hover:shadow-sm transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold px-3 text-gray-800 font-sans min-w-[120px] text-center">
            {monthName} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-gray-655 hover:bg-white hover:text-indigo-655 hover:shadow-sm transition cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">
        {weekdays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      {loading ? (
        <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading calendar...</span>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Offset for first day of month */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`offset-${idx}`} className="aspect-square bg-gray-50/50 rounded-xl border border-gray-100/50" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const { status, dayLogs, dayDate } = getDayDetails(dayNum);
            const totalMs = calculateTotalDayMs(dayLogs);
            const hasActive = dayLogs.some((l) => l.clockOut === null);

            const dayRequests = requests.filter(r => {
              const d = new Date(r.clockIn);
              return d.getDate() === dayNum && d.getMonth() === month && d.getFullYear() === year;
            });
            const hasPendingRequest = dayRequests.some(r => r.status === "PENDING");

            let bgClass = "";
            let textClass = "";

            if (status === "green") {
              bgClass = "bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80 hover:border-emerald-300";
              textClass = "text-emerald-950 font-bold";
            } else if (status === "blue") {
              bgClass = "bg-blue-50 border-blue-200 hover:bg-blue-100/80 hover:border-blue-300";
              textClass = "text-blue-950 font-bold";
            } else if (status === "red") {
              bgClass = "bg-red-50 border-red-200 hover:bg-red-100/60 hover:border-red-300";
              textClass = "text-red-700 font-medium";
            } else if (status === "grey") {
              bgClass = "bg-gray-100 border-gray-200 hover:bg-gray-200/80";
              textClass = "text-gray-400";
            } else {
              bgClass = "bg-white border-gray-100 hover:bg-gray-50 text-gray-400";
              textClass = "text-gray-400";
            }

            let borderStyle = "";
            if (hasPendingRequest) {
              borderStyle = "ring-2 ring-amber-400 ring-offset-1";
            }

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => {
                  setSelectedDay({ dayNum, logs: dayLogs, date: dayDate });
                  setShowRequestForm(false);
                }}
                className={`relative group aspect-square flex flex-col items-center justify-between p-1.5 rounded-xl border text-sm transition-all duration-200 hover:scale-[1.04] hover:shadow-sm cursor-pointer ${bgClass} ${textClass} ${borderStyle}`}
              >
                <span className="text-xs font-bold leading-none">{dayNum}</span>

                {/* Status Dot */}
                {hasPendingRequest ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                ) : (status === "green" || status === "blue") && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    hasActive 
                      ? "bg-indigo-500 animate-pulse" 
                      : status === "blue" 
                        ? "bg-blue-500" 
                        : "bg-emerald-500"
                  }`} />
                )}

                {/* Hover Quick-Tooltip */}
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 absolute z-40 bottom-full mb-3 left-1/2 transform -translate-x-1/2 w-48 p-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-lg pointer-events-none text-center">
                  <p className="font-bold text-[10px] text-slate-200">
                    {monthName} {dayNum}, {year}
                  </p>
                  <div className="text-[10px] mt-0.5 text-slate-400 space-y-0.5">
                    {hasPendingRequest && (
                      <p className="text-amber-400 font-bold">⚠️ Pending Edit Request</p>
                    )}
                    <p>
                      {(status === "green" || status === "blue")
                        ? `Present (${status === "blue" ? "WFH" : "In Office"}): ${formatDuration(totalMs)}`
                        : status === "red"
                        ? "No record (Absent)"
                        : status === "grey"
                        ? "Weekend"
                        : "Future Date"}
                    </p>
                  </div>
                  <p className="text-[9px] mt-1 text-indigo-400 font-medium">Click to view log details</p>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[5px] border-transparent border-t-slate-900" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-200" />
          <span>Office</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-blue-50 border border-blue-200" />
          <span>WFH</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-gray-100 border border-gray-200" />
          <span>Weekend</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-white border border-gray-100" />
          <span>Future</span>
        </div>
      </div>

      {/* Date Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-white border border-gray-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gray-50/80 px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <h4 className="font-bold text-gray-900 font-sans">
                  {selectedDay.date.toLocaleDateString([], {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h4>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Daily Attendance Summary Card */}
              {selectedDay.logs.length > 0 ? (
                <div>
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Present (Recorded Attendance)</p>
                      <p className="text-xs text-emerald-700 font-medium">
                        Total worked duration:{" "}
                        <span className="underline font-bold text-sm bg-emerald-100/50 px-1.5 py-0.5 rounded-md">
                          {formatDuration(calculateTotalDayMs(selectedDay.logs))}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Logs Chronological Table */}
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Clock In / Out Sessions</span>
                    </p>
                    <div className="border rounded-2xl overflow-hidden divide-y">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">Clock In</th>
                            <th className="px-4 py-2.5">Clock Out</th>
                            <th className="px-4 py-2.5">Location</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono">
                          {selectedDay.logs.map((log, index) => {
                            return (
                              <tr key={log.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-gray-400 font-sans font-medium">{index + 1}</td>
                                <td className="px-4 py-3 text-gray-900 font-semibold">
                                  {formatTime(log.clockIn)}
                                </td>
                                <td className="px-4 py-3">
                                  {log.clockOut ? (
                                    <span className="text-gray-950 font-semibold">
                                      {formatTime(log.clockOut)}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 animate-pulse font-sans">
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                   <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold font-sans uppercase border ${
                                     log.workLocation === "WORK_FROM_HOME"
                                       ? "bg-blue-50 text-blue-700 border-blue-100"
                                       : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                   }`}>
                                     {log.workLocation === "WORK_FROM_HOME" ? "WFH" : "Office"}
                                   </span>
                                 </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => {
                                      const inTimeStr = new Date(log.clockIn).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit" });
                                      const outTimeStr = log.clockOut 
                                        ? new Date(log.clockOut).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit" })
                                        : "17:00";
                                      setRequestFormData({
                                        clockInTime: inTimeStr,
                                        clockOutTime: outTimeStr,
                                        workLocation: log.workLocation || "IN_OFFICE",
                                        reason: "",
                                        attendanceId: log.id
                                      });
                                      setShowRequestForm(true);
                                    }}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Request modification"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                // No logs recorded
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  {selectedDay.date.getDay() === 0 || selectedDay.date.getDay() === 6 ? (
                    <>
                      <div className="bg-gray-100 p-4 rounded-full border">
                        <HelpCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-800">Weekend Day</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                          This date falls on a weekend. No clock-in or attendance records were required.
                        </p>
                      </div>
                    </>
                  ) : selectedDay.date > new Date() ? (
                    <>
                      <div className="bg-gray-50 p-4 rounded-full border border-dashed">
                        <Calendar className="h-8 w-8 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-400">Future Date</p>
                        <p className="text-xs text-gray-400 mt-1">
                          This day has not occurred yet. Attendance logging will open on this day.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-50 p-4 rounded-full border border-red-100">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-red-800">Absent / No Record</p>
                        <p className="text-xs text-red-400 mt-1 max-w-[280px]">
                          No check-in session logged for this day.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Day Requests Log */}
              {requests.filter(r => {
                const d = new Date(r.clockIn);
                return d.getDate() === selectedDay.dayNum && d.getMonth() === month && d.getFullYear() === year;
              }).length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Request History</p>
                  <div className="space-y-2">
                    {requests.filter(r => {
                      const d = new Date(r.clockIn);
                      return d.getDate() === selectedDay.dayNum && d.getMonth() === month && d.getFullYear() === year;
                    }).map(req => (
                      <div key={req.id} className="flex items-center justify-between text-xs border p-3 rounded-xl bg-slate-50">
                        <div>
                          <p className="font-bold text-gray-900">
                            {req.type === "CREATE" ? "Manual Entry Request" : "Clock Session Modification"}
                          </p>
                          <p className="text-gray-500 mt-0.5">
                            {formatTime(req.clockIn)} - {req.clockOut ? formatTime(req.clockOut) : "Active"} ({req.workLocation === "WORK_FROM_HOME" ? "WFH" : "Office"})
                          </p>
                          {req.reason && <p className="text-gray-400 mt-1 italic">Reason: &quot;{req.reason}&quot;</p>}
                        </div>
                        <Badge 
                          variant={req.status === "APPROVED" ? "default" : req.status === "REJECTED" ? "destructive" : "secondary"}
                          className={req.status === "PENDING" ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
                        >
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Form */}
              {showRequestForm ? (
                <div className="border border-indigo-100 p-4 rounded-2xl bg-indigo-50/30 space-y-4 animate-in fade-in duration-200">
                  <h5 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <span>{requestFormData.attendanceId ? "Request Clock Session Edit" : "Request Manual Attendance"}</span>
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Clock In Time</Label>
                      <input 
                        type="time" 
                        value={requestFormData.clockInTime}
                        onChange={e => setRequestFormData({ ...requestFormData, clockInTime: e.target.value })}
                        className="w-full border rounded-lg p-2 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-gray-700">Clock Out Time</Label>
                      <input 
                        type="time" 
                        value={requestFormData.clockOutTime}
                        onChange={e => setRequestFormData({ ...requestFormData, clockOutTime: e.target.value })}
                        className="w-full border rounded-lg p-2 bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <Label className="font-bold text-gray-700 block">Work Location</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="location"
                          checked={requestFormData.workLocation === "IN_OFFICE"}
                          onChange={() => setRequestFormData({ ...requestFormData, workLocation: "IN_OFFICE" })}
                          className="accent-indigo-650 animate-none"
                        />
                        <span>Office</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="location"
                          checked={requestFormData.workLocation === "WORK_FROM_HOME"}
                          onChange={() => setRequestFormData({ ...requestFormData, workLocation: "WORK_FROM_HOME" })}
                          className="accent-indigo-650 animate-none"
                        />
                        <span>WFH</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <Label className="font-bold text-gray-700">Reason for Request</Label>
                    <textarea 
                      value={requestFormData.reason}
                      onChange={e => setRequestFormData({ ...requestFormData, reason: e.target.value })}
                      placeholder="e.g. Forgot to clock in, Client site visit..."
                      className="w-full border rounded-lg p-2 bg-white min-h-[60px]"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 text-xs">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowRequestForm(false)}>Cancel</Button>
                    <Button 
                      type="button"
                      size="sm" 
                      onClick={handleRequestSubmit}
                      disabled={submittingRequest}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {submittingRequest ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </div>
              ) : (
                selectedDay.date <= new Date() && (
                  <div className="flex justify-center border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setRequestFormData({
                          clockInTime: "09:00",
                          clockOutTime: "17:00",
                          workLocation: "IN_OFFICE",
                          reason: "",
                          attendanceId: ""
                        });
                        setShowRequestForm(true);
                      }}
                      className="flex-1 border-indigo-200 text-indigo-750 hover:bg-indigo-50 flex items-center justify-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Request Manual Clock Log</span>
                    </Button>
                    {!userId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const dateStr = selectedDay.date.toISOString().split('T')[0];
                          window.location.href = `/employee/leaves?date=${dateStr}`;
                        }}
                        className="flex-1 border-purple-200 text-purple-750 hover:bg-purple-50 flex items-center justify-center gap-1"
                      >
                        <Palmtree className="h-4 w-4 text-purple-500" />
                        <span>Request Leave</span>
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end border-t gap-2">
              <button
                onClick={() => setSelectedDay(null)}
                className="bg-white border hover:bg-gray-50 text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers for the selected day calculations
function calculateLogMs(log: AttendanceLog) {
  const start = new Date(log.clockIn).getTime();
  const end = log.clockOut ? new Date(log.clockOut).getTime() : new Date().getTime();
  return Math.max(0, end - start);
}

function calculateTotalDayMs(dayLogs: AttendanceLog[]) {
  let totalMs = 0;
  dayLogs.forEach((log) => {
    totalMs += calculateLogMs(log);
  });
  return totalMs;
}
