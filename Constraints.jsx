import React, { useState } from "react";
import { AlertTriangle, FileQuestion, DollarSign, Scale } from "lucide-react";

// =============================================================================
// MODULE 7 — Constraints (+ Change Orders, RFIs, Contractual Issues)
// =============================================================================
const CONSTRAINT_STATUS_META = {
  open: { label: "Open", chip: "bg-red-50 text-red-700 border-red-200" },
  under_review: { label: "Under Review", chip: "bg-blue-50 text-blue-700 border-blue-200" },
  action_assigned: { label: "Action Assigned", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  resolved: { label: "Resolved", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", chip: "bg-gray-100 text-gray-500 border-gray-200" },
  overdue: { label: "Overdue", chip: "bg-red-50 text-red-700 border-red-200" },
  pending: { label: "Pending", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", chip: "bg-red-50 text-red-700 border-red-200" },
  answered: { label: "Answered", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const CONSTRAINTS_DATA = [
  { id: "CST-014", category: "Material", description: "Rebar delivery delayed for Level 02 slab", activity: "Slab Rebar / Z02-03", status: "open", priority: "High" },
  { id: "CST-015", category: "Access", description: "MEP crew blocked pending scaffold removal", activity: "MEP Rough-In / Z02-02", status: "action_assigned", priority: "Medium" },
  { id: "CST-016", category: "Inspection", description: "Awaiting rebar inspection sign-off before pour", activity: "Concrete Slab / Z02-03", status: "under_review", priority: "High" },
];

const CHANGE_ORDERS = [
  { id: "CO-007", title: "Revised waterproofing detail per FD-014", activity: "Waterproofing / Z02-04", costImpact: "$18,400", scheduleImpact: "+2 days", status: "pending" },
  { id: "CO-008", title: "Additional sump pit shoring enclosure", activity: "C7 Precast Sump Pit", costImpact: "$42,000", scheduleImpact: "+5 days", status: "approved" },
];

const RFIS = [
  { id: "RFI-032", subject: "Clarify rebar cover at sump pit corner detail", activity: "C7 Precast Sump Pit", raisedDate: "2026-07-08", dueDate: "2026-07-16", status: "open" },
  { id: "RFI-033", subject: "Confirm MEP sleeve locations vs. structural drawing", activity: "MEP Rough-In / Z02-02", raisedDate: "2026-07-10", dueDate: "2026-07-17", status: "answered" },
];

const CONTRACTUAL_ISSUES = [
  { id: "CI-004", description: "Dispute over responsibility for MEP mobilization delay", responsible: "MEP Sub", status: "under_review" },
  { id: "CI-005", description: "Extension of time request — piezometric monitoring delay", responsible: "General Contractor", status: "open" },
];

const CONSTRAINTS_TABS = [
  { key: "constraints", label: "Constraints", icon: AlertTriangle },
  { key: "change_orders", label: "Change Orders", icon: DollarSign },
  { key: "rfis", label: "RFIs", icon: FileQuestion },
  { key: "contractual", label: "Contractual Issues", icon: Scale },
];

function ConstraintsContent() {
  const [tab, setTab] = useState("constraints");

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div><div className="text-base font-medium text-gray-900">Constraints</div><div className="text-xs text-gray-500">Constraints, change orders, RFIs, and contractual issues in one place</div></div>
      </div>
      <div className="flex items-center gap-5 px-6 border-b border-gray-200 bg-white shrink-0">
        {CONSTRAINTS_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 py-2.5 text-xs border-b-2 ${tab === t.key ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "constraints" && (
          <table className="w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">ID</th><th className="px-4 py-2 font-normal">Category</th>
              <th className="px-4 py-2 font-normal">Description</th><th className="px-4 py-2 font-normal">Activity</th>
              <th className="px-4 py-2 font-normal">Priority</th><th className="px-4 py-2 font-normal">Status</th>
            </tr></thead>
            <tbody>
              {CONSTRAINTS_DATA.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500">{c.id}</td><td className="px-4 py-2.5 text-gray-600">{c.category}</td>
                  <td className="px-4 py-2.5 text-gray-900">{c.description}</td><td className="px-4 py-2.5 text-gray-600">{c.activity}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.priority}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full border ${CONSTRAINT_STATUS_META[c.status].chip}`}>{CONSTRAINT_STATUS_META[c.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "change_orders" && (
          <table className="w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">ID</th><th className="px-4 py-2 font-normal">Title</th>
              <th className="px-4 py-2 font-normal">Activity</th><th className="px-4 py-2 font-normal">Cost Impact</th>
              <th className="px-4 py-2 font-normal">Schedule Impact</th><th className="px-4 py-2 font-normal">Status</th>
            </tr></thead>
            <tbody>
              {CHANGE_ORDERS.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500">{c.id}</td><td className="px-4 py-2.5 text-gray-900">{c.title}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.activity}</td><td className="px-4 py-2.5 text-gray-600">{c.costImpact}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.scheduleImpact}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full border ${CONSTRAINT_STATUS_META[c.status].chip}`}>{CONSTRAINT_STATUS_META[c.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "rfis" && (
          <table className="w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">ID</th><th className="px-4 py-2 font-normal">Subject</th>
              <th className="px-4 py-2 font-normal">Activity</th><th className="px-4 py-2 font-normal">Raised</th>
              <th className="px-4 py-2 font-normal">Due</th><th className="px-4 py-2 font-normal">Status</th>
            </tr></thead>
            <tbody>
              {RFIS.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500">{r.id}</td><td className="px-4 py-2.5 text-gray-900">{r.subject}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.activity}</td><td className="px-4 py-2.5 text-gray-600">{r.raisedDate}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.dueDate}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full border ${CONSTRAINT_STATUS_META[r.status].chip}`}>{CONSTRAINT_STATUS_META[r.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "contractual" && (
          <table className="w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">ID</th><th className="px-4 py-2 font-normal">Description</th>
              <th className="px-4 py-2 font-normal">Responsible</th><th className="px-4 py-2 font-normal">Status</th>
            </tr></thead>
            <tbody>
              {CONTRACTUAL_ISSUES.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500">{c.id}</td><td className="px-4 py-2.5 text-gray-900">{c.description}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.responsible}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full border ${CONSTRAINT_STATUS_META[c.status].chip}`}>{CONSTRAINT_STATUS_META[c.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}


export default ConstraintsContent;
