"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function GlobalSearch({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const prefix = role === "TEAM_LEADER" ? "/tl" : "/employee";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors w-64 border border-gray-200"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <Command
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            >
              <div className="flex items-center px-4 border-b">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <Command.Input 
                  autoFocus 
                  placeholder="Type a command or search..." 
                  className="w-full bg-transparent py-4 outline-none text-sm placeholder:text-gray-400"
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-gray-500">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-gray-500">
                  <Command.Item
                    onSelect={() => runCommand(() => router.push(prefix))}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                  >
                    Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push(`${prefix}/work`))}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                  >
                    Work Items
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push(`${prefix}/clients`))}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                  >
                    Clients
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push(`${prefix}/processes`))}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                  >
                    Processes
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push(`${prefix}/pool`))}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                  >
                    Open Pool
                  </Command.Item>
                  {role === "TEAM_LEADER" && (
                    <Command.Item
                      onSelect={() => runCommand(() => router.push(`${prefix}/settings`))}
                      className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                    >
                      Settings
                    </Command.Item>
                  )}
                </Command.Group>
              </Command.List>
            </Command>
          </div>
          {/* Overlay click to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
