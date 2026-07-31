"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KW_STEPS } from "./constants";

interface ClientDrawerProps {
  selectedKwClientDetail: any;
  onClose: () => void;
  clientChecklistItems: Record<string, string[]>;
  checklists: Record<string, Record<string, boolean>>;
  toggleChecklistStep: (clientId: string, groupName: string, stepText: string) => void;
  addChecklistItem: (clientId: string, groupName: string, newItemText: string) => void;
  deleteChecklistItem: (clientId: string, groupName: string, itemText: string) => void;
  resetChecklist: (clientId: string, groupName: string) => void;
}

export function ClientDrawer({
  selectedKwClientDetail,
  onClose,
  clientChecklistItems,
  checklists,
  toggleChecklistStep,
  addChecklistItem,
  deleteChecklistItem,
  resetChecklist,
}: ClientDrawerProps) {
  const [newAmcItem, setNewAmcItem] = useState("");
  const [newSeoItem, setNewSeoItem] = useState("");
  const [newRevampItem, setNewRevampItem] = useState("");

  if (!selectedKwClientDetail) return null;

  const amcKey = `${selectedKwClientDetail.id}::AMC`;
  const seoKey = `${selectedKwClientDetail.id}::SEO`;
  const revampKey = `${selectedKwClientDetail.id}::Revamp`;

  const amcItems = clientChecklistItems[amcKey] || KW_STEPS.AMC;
  const seoItems = clientChecklistItems[seoKey] || KW_STEPS.SEO;
  const revampItems = clientChecklistItems[revampKey] || KW_STEPS.Revamp;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Drawer container */}
      <div className="relative w-full max-w-[500px] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold tracking-wide uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Client Checklist
            </span>
            <h3 className="text-2xl font-bold text-gray-900 font-heading mt-1">{selectedKwClientDetail.name}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {selectedKwClientDetail.status}
              </Badge>
              {selectedKwClientDetail.revamp !== "None" && (
                <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50/30">
                  Revamp: {selectedKwClientDetail.revamp}
                </Badge>
              )}
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors font-semibold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Checklist Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* AMC Checklist */}
          {selectedKwClientDetail.amc && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">AMC Maintenance Checklist</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-6 text-indigo-600 hover:text-indigo-800"
                  onClick={() => resetChecklist(selectedKwClientDetail.id, "AMC")}
                >
                  Reset
                </Button>
              </div>
              {/* Add Custom Item Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom AMC task..."
                  value={newAmcItem}
                  onChange={(e) => setNewAmcItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addChecklistItem(selectedKwClientDetail.id, "AMC", newAmcItem);
                      setNewAmcItem("");
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    addChecklistItem(selectedKwClientDetail.id, "AMC", newAmcItem);
                    setNewAmcItem("");
                  }}
                  className="h-8 text-xs px-3 bg-slate-900 text-white"
                >
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {amcItems.map((step, idx) => {
                  const isDone = checklists[amcKey]?.[step] || false;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50/80 transition-colors"
                    >
                      <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          checked={isDone}
                          onChange={() => toggleChecklistStep(selectedKwClientDetail.id, "AMC", step)}
                        />
                        <span className={isDone ? "text-sm line-through text-gray-400" : "text-sm text-gray-700 font-medium"}>
                          {step}
                        </span>
                      </label>
                      <button
                        onClick={() => deleteChecklistItem(selectedKwClientDetail.id, "AMC", step)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors ml-2"
                        title="Delete Item"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEO Checklist */}
          {selectedKwClientDetail.seo && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">SEO Audit &amp; Outreach</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-6 text-indigo-600 hover:text-indigo-800"
                  onClick={() => resetChecklist(selectedKwClientDetail.id, "SEO")}
                >
                  Reset
                </Button>
              </div>
              {/* Add Custom Item Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom SEO task..."
                  value={newSeoItem}
                  onChange={(e) => setNewSeoItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addChecklistItem(selectedKwClientDetail.id, "SEO", newSeoItem);
                      setNewSeoItem("");
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    addChecklistItem(selectedKwClientDetail.id, "SEO", newSeoItem);
                    setNewSeoItem("");
                  }}
                  className="h-8 text-xs px-3 bg-slate-900 text-white"
                >
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {seoItems.map((step, idx) => {
                  const isDone = checklists[seoKey]?.[step] || false;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50/80 transition-colors"
                    >
                      <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          checked={isDone}
                          onChange={() => toggleChecklistStep(selectedKwClientDetail.id, "SEO", step)}
                        />
                        <span className={isDone ? "text-sm line-through text-gray-400" : "text-sm text-gray-700 font-medium"}>
                          {step}
                        </span>
                      </label>
                      <button
                        onClick={() => deleteChecklistItem(selectedKwClientDetail.id, "SEO", step)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors ml-2"
                        title="Delete Item"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Revamp Checklist */}
          {selectedKwClientDetail.revamp && selectedKwClientDetail.revamp !== "None" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Revamp Stage Checklist</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-6 text-indigo-600 hover:text-indigo-800"
                  onClick={() => resetChecklist(selectedKwClientDetail.id, "Revamp")}
                >
                  Reset
                </Button>
              </div>
              {/* Add Custom Item Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom Revamp task..."
                  value={newRevampItem}
                  onChange={(e) => setNewRevampItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addChecklistItem(selectedKwClientDetail.id, "Revamp", newRevampItem);
                      setNewRevampItem("");
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    addChecklistItem(selectedKwClientDetail.id, "Revamp", newRevampItem);
                    setNewRevampItem("");
                  }}
                  className="h-8 text-xs px-3 bg-slate-900 text-white"
                >
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {revampItems.map((step, idx) => {
                  const isDone = checklists[revampKey]?.[step] || false;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50/80 transition-colors"
                    >
                      <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          checked={isDone}
                          onChange={() => toggleChecklistStep(selectedKwClientDetail.id, "Revamp", step)}
                        />
                        <span className={isDone ? "text-sm line-through text-gray-400" : "text-sm text-gray-700 font-medium"}>
                          {step}
                        </span>
                      </label>
                      <button
                        onClick={() => deleteChecklistItem(selectedKwClientDetail.id, "Revamp", step)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors ml-2"
                        title="Delete Item"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end">
          <Button onClick={onClose} className="w-full bg-slate-900 text-white hover:bg-slate-800">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
