"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Play, Square, Clock, Loader2 } from "lucide-react";
import { clockInAction, clockOutAction, getActiveSessionAction } from "@/actions/attendance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AttendanceSession {
  id: string;
  clockIn: string;
  clockOut: string | null;
}

export function ClockWidget() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"in" | "out" | null>(null);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<"IN_OFFICE" | "WORK_FROM_HOME">("IN_OFFICE");

  // Live Digital Clock Time-of-Day
  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial clock-in status
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await getActiveSessionAction();
        if (res.success) {
          setSession(res.data);
          if (!res.data) {
            setIsLocationOpen(true);
          }
        } else {
          toast.error(res.error || "Failed to load clock-in status");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  // Update timer every second if clocked in
  useEffect(() => {
    if (!session) {
      Promise.resolve().then(() => setElapsedTime(""));
      return;
    }

    const clockInTime = new Date(session.clockIn).getTime();

    function updateTimer() {
      const now = new Date().getTime();
      const diffMs = Math.max(0, now - clockInTime);

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hrsStr = hours > 0 ? `${hours}h ` : "";
      const minsStr = `${minutes}m `;
      const secsStr = `${seconds}s`;

      setElapsedTime(`${hrsStr}${minsStr}${secsStr}`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleClockIn = async (loc?: "IN_OFFICE" | "WORK_FROM_HOME") => {
    setLoading(true);
    try {
      const res = await clockInAction(loc || selectedLocation);
      if (res.success && res.data) {
        setSession(res.data);
        const timeStr = new Date(res.data.clockIn).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        toast.success(`Clocked in successfully at ${timeStr}`);
      } else {
        toast.error(res.error || "Failed to clock in");
      }
    } catch (err) {
      toast.error("An error occurred during clock-in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const res = await clockOutAction();
      if (res.success && res.data) {
        setSession(null);
        const inTime = new Date(res.data.clockIn).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const outTime = res.data.clockOut
          ? new Date(res.data.clockOut).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        toast.success(`Clocked out successfully! (In: ${inTime} - Out: ${outTime})`);
      } else {
        toast.error(res.error || "Failed to clock out");
      }
    } catch (err) {
      toast.error("An error occurred during clock-out");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span>Loading attendance...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Live Digital clock time of day */}
      {currentTime && (
        <div className="font-digital text-lg font-bold tabular-nums tracking-wider text-black select-none hidden sm:block">
          {currentTime}
        </div>
      )}

      {session ? (
        // Clocked In State
        <div className={`flex items-center gap-3 border pl-3.5 pr-2 py-1.5 rounded-xl shadow-sm transition-all duration-300 ${
          session.workLocation === "WORK_FROM_HOME"
            ? "bg-blue-50/50 border-blue-200/60 text-blue-700"
            : "bg-emerald-50/50 border-emerald-200/60 text-emerald-700"
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                session.workLocation === "WORK_FROM_HOME" ? "bg-blue-400" : "bg-emerald-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                session.workLocation === "WORK_FROM_HOME" ? "bg-blue-500" : "bg-emerald-500"
              }`}></span>
            </span>
            <span className={`text-xs font-semibold uppercase tracking-wider font-sans ${
              session.workLocation === "WORK_FROM_HOME" ? "text-blue-600" : "text-emerald-600"
            }`}>
              {session.workLocation === "WORK_FROM_HOME" ? "WFH Active" : "In Office"}
            </span>
            {elapsedTime && (
              <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded-md font-mono ${
                session.workLocation === "WORK_FROM_HOME"
                  ? "text-blue-700 bg-blue-100/50"
                  : "text-emerald-700 bg-emerald-100/50"
              }`}>
                {elapsedTime}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setConfirmAction("out");
              setIsConfirmOpen(true);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-red-200/50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Square className="h-3 w-3 fill-white text-white" />
            )}
            Clock Out
          </button>
        </div>
      ) : (
        // Clocked Out State
        <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-200/60 pl-3.5 pr-2 py-1.5 rounded-xl shadow-sm transition-all duration-300">
          <div className="flex items-center gap-2 text-emerald-700">
            <Clock className="h-4 w-4 animate-pulse text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 font-sans">
              Clocked Out
            </span>
          </div>
          <button
            onClick={() => {
              setIsLocationOpen(true);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-200/50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3 fill-white text-white" />
            )}
            Clock In
          </button>
        </div>
      )}

      {/* Select Location Dialog */}
      <Dialog open={isLocationOpen} onOpenChange={setIsLocationOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Select Work Location</DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              Choose your work mode for today&apos;s session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              type="button"
              onClick={() => {
                setSelectedLocation("IN_OFFICE");
                setIsLocationOpen(false);
                setConfirmAction("in");
                setIsConfirmOpen(true);
              }}
              className="flex flex-col items-center justify-center p-6 border-2 border-emerald-200 rounded-2xl hover:bg-emerald-50/50 hover:border-emerald-500 active:scale-95 transition-all text-emerald-800 font-semibold gap-3 cursor-pointer shadow-xs shadow-emerald-100"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span>In Office</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedLocation("WORK_FROM_HOME");
                setIsLocationOpen(false);
                setConfirmAction("in");
                setIsConfirmOpen(true);
              }}
              className="flex flex-col items-center justify-center p-6 border-2 border-blue-200 rounded-2xl hover:bg-blue-50/50 hover:border-blue-500 active:scale-95 transition-all text-blue-800 font-semibold gap-3 cursor-pointer shadow-xs shadow-blue-100"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span>Work From Home</span>
            </button>
          </div>
          <DialogFooter className="sm:justify-center">
            <button
              type="button"
              onClick={() => setIsLocationOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {confirmAction === "in" ? "Confirm Clock In" : "Confirm Clock Out"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {confirmAction === "in"
                ? `Are you ready to clock in for your ${selectedLocation === "WORK_FROM_HOME" ? "Work From Home" : "In Office"} session today?`
                : "Are you sure you want to clock out? This will end your active work session."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4 pt-2">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsConfirmOpen(false);
                if (confirmAction === "in") {
                  handleClockIn();
                } else if (confirmAction === "out") {
                  handleClockOut();
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white active:scale-95 transition-all cursor-pointer ${
                confirmAction === "in"
                  ? selectedLocation === "WORK_FROM_HOME"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
