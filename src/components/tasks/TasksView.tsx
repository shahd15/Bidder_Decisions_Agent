import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  User,
  Clock,
  CheckCircle2,
  FileQuestion,
  Layers,
  ArrowRight,
} from "lucide-react";
import { ProcurementTask, TenderOpportunity } from "../../types/procurement";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface TasksViewProps {
  tasks: ProcurementTask[];
  opportunities: TenderOpportunity[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: ProcurementTask) => void;
}

export function TasksView({
  tasks,
  opportunities,
  onToggleTask,
  onAddTask,
}: TasksViewProps) {
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("pending");
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<ProcurementTask["category"]>("Clarification RFI");
  const [newTaskPriority, setNewTaskPriority] = useState<ProcurementTask["priority"]>("high");
  const [newTaskOppId, setNewTaskOppId] = useState(opportunities[0]?.id || "");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-10-15");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Marcus Sterling (Bid Director)");

  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = filterCategory === "All" || t.category === filterCategory;
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "pending"
        ? !t.completed
        : t.completed;
    return matchesCategory && matchesStatus;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const selectedOpp = opportunities.find((o) => o.id === newTaskOppId) || opportunities[0];

    const assigneeMap: Record<string, { role: string; initials: string }> = {
      "Marcus Sterling (Bid Director)": { role: "Bid & Commercial Lead", initials: "MS" },
      "Dr. Eleanor Vance": { role: "Quality & Compliance Director", initials: "EV" },
      "David Chen": { role: "Senior Biomedical Engineer", initials: "DC" },
      "Sarah Jenkins": { role: "Commercial Pricing Analyst", initials: "SJ" },
      "Henrik Lindqvist": { role: "Logistics Operations Lead", initials: "HL" },
    };

    const details = assigneeMap[newTaskAssignee] || { role: "Procurement Specialist", initials: "PS" };

    const task: ProcurementTask = {
      id: `task-${Date.now()}`,
      opportunityId: selectedOpp?.id || "opp-gen",
      opportunityRef: selectedOpp?.referenceCode || "NHS-GEN-2026",
      opportunityTitle: selectedOpp?.title || "Healthcare Framework",
      title: newTaskTitle,
      category: newTaskCategory,
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      assignee: {
        name: newTaskAssignee.split(" (")[0],
        role: details.role,
        avatarInitials: details.initials,
      },
      completed: false,
    };

    onAddTask(task);
    setNewTaskTitle("");
    setShowAddModal(false);
  };

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const criticalCount = tasks.filter((t) => !t.completed && t.priority === "critical").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F2747]">
            Procurement Action Plan & Clarification Questions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track RFIs to contracting authorities, technical gap mitigations, and executive tender sign-offs
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Action Task
        </Button>
      </div>

      {/* KPI mini strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs">
          <span className="text-slate-500">Pending Actions</span>
          <div className="text-lg font-bold text-[#0F2747]">{pendingCount} Tasks</div>
        </div>
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs">
          <span className="text-rose-600 font-medium">Critical Deadlines</span>
          <div className="text-lg font-bold text-rose-700">{criticalCount} Urgent</div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
          <span className="text-emerald-700 font-medium">Completed</span>
          <div className="text-lg font-bold text-emerald-800">
            {tasks.filter((t) => t.completed).length} Tasks
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs">
          <span className="text-slate-500">Active Authorities</span>
          <div className="text-lg font-bold text-[#0F2747]">4 NHS Trusts + EU</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status segmented controls */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 mr-1 text-[11px]">Status:</span>
          {(["pending", "all", "completed"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                filterStatus === st
                  ? "bg-[#0F2747] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 text-xs bg-slate-50 border border-slate-200 rounded px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
          >
            <option value="All">All Categories ({tasks.length})</option>
            <option value="Clarification RFI">Clarification RFI</option>
            <option value="Technical Gap">Technical Gap</option>
            <option value="Regulatory Evidence">Regulatory Evidence</option>
            <option value="Pricing Model">Pricing Model</option>
            <option value="Executive Sign-Off">Executive Sign-Off</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No tasks found matching current filters.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border transition-all bg-white text-xs ${
                task.completed
                  ? "border-slate-200/60 bg-slate-50/40 opacity-75"
                  : task.priority === "critical"
                  ? "border-rose-200 hover:border-rose-300 shadow-2xs"
                  : "border-slate-200/90 hover:border-[#2F80ED] shadow-2xs"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-slate-400 hover:text-[#2F80ED] transition-colors shrink-0"
                  aria-label="Toggle task status"
                >
                  {task.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500 font-semibold">
                      {task.opportunityRef}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {task.category}
                    </span>

                    {task.priority === "critical" && (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        CRITICAL PRIORITY
                      </span>
                    )}
                    {task.priority === "high" && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                        High Priority
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-sm font-semibold leading-snug ${
                      task.completed ? "line-through text-slate-400" : "text-[#0F2747]"
                    }`}
                  >
                    {task.title}
                  </p>

                  <div className="text-[11px] text-slate-500 truncate">
                    Tender: {task.opportunityTitle}
                  </div>

                  {task.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                      <strong>Notes:</strong> {task.notes}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1.5 text-right pl-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#0F2747] text-white text-[9px] font-bold flex items-center justify-center">
                      {task.assignee.avatarInitials}
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 hidden sm:inline">
                      {task.assignee.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span
                      className={
                        !task.completed && task.priority === "critical"
                          ? "text-rose-600 font-semibold"
                          : ""
                      }
                    >
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Action Plan Task or Tender Clarification RFI"
        subtitle="Tasks link directly to specific tenders and buyer submission requirements"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Target Healthcare Tender</label>
            <select
              value={newTaskOppId}
              onChange={(e) => setNewTaskOppId(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            >
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.referenceCode} — {o.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Task Title / Action Required</label>
            <input
              type="text"
              required
              placeholder="e.g. Verify 2-hr response window with Newcastle service subcontractor"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Category</label>
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as any)}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              >
                <option value="Clarification RFI">Clarification RFI</option>
                <option value="Technical Gap">Technical Gap</option>
                <option value="Regulatory Evidence">Regulatory Evidence</option>
                <option value="Pricing Model">Pricing Model</option>
                <option value="Executive Sign-Off">Executive Sign-Off</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              >
                <option value="critical">Critical (Impacts qualification)</option>
                <option value="high">High (Scoring impact)</option>
                <option value="medium">Medium (Documentation review)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Assigned Lead</label>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              >
                <option value="Marcus Sterling (Bid Director)">Marcus Sterling (Bid Director)</option>
                <option value="Dr. Eleanor Vance">Dr. Eleanor Vance (Quality & Regulatory)</option>
                <option value="David Chen">David Chen (Biomedical Engineering)</option>
                <option value="Sarah Jenkins">Sarah Jenkins (Commercial Pricing)</option>
                <option value="Henrik Lindqvist">Henrik Lindqvist (Logistics & Supply Chain)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Due Date</label>
              <input
                type="date"
                required
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Action Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
