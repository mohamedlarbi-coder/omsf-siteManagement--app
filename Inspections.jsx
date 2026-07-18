import React, { useState, useMemo } from "react";
import { Clock } from "lucide-react";

// =============================================================================
// MODULE 6 — Inspections (derived from the Look-Ahead: what needs to be
// inspected, by area/scope/date, so the team can prepare in time)
// =============================================================================
const INSPECTION_STATUS = {
  not_requested: { label: "Not Requested", chip: "bg-gray-100 text-gray-500 border-gray-200" },
  requested:     { label: "Requested",     chip: "bg-blue-50 text-blue-700 border-blue-200" },
  passed:        { label: "Passed",        chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed:        { label: "Failed",        chip: "bg-red-50 text-red-700 border-red-200" },
};

// Each row ties back to a Look-Ahead activity (activity_id) — this is what
// makes the list "ready by area / scope / date" instead of a separate log.
const INSPECTIONS = [
  { id: "INS-101", activityId: "ACT-0234", activity: "Rebar Installation", zone: "Z02-01", scope: "Concrete", type: "Rebar Inspection", dueDate: "2026-07-16", status: "requested" },
  { id: "INS-102", activityId: "ACT-0242", activity: "Slab Formwork", zone: "Z02-03", scope: "Concrete", type: "Formwork Inspection", dueDate: "2026-07-17", status: "not_requested" },
  { id: "INS-103", activityId: "ACT-0244", activity: "Slab Rebar", zone: "Z02-03", scope: "Concrete", type: "Rebar Inspection", dueDate: "2026-07-18", status: "not_requested" },
  { id: "INS-104", activityId: "ACT-0240", activity: "MEP Rough-In", zone: "Z02-02", scope: "Mechanical", type: "Rough-In Inspection", dueDate: "2026-07-15", status: "failed" },
  { id: "INS-105", activityId: "ACT-0248", activity: "Block Work", zone: "Z02-04", scope: "Masonry", type: "Masonry Inspection", dueDate: "2026-07-20", status: "not_requested" },
  { id: "INS-106", activityId: "ACT-0251", activity: "Waterproofing", zone: "Z02-04", scope: "Waterproofing", type: "Waterproofing Inspection", dueDate: "2026-07-22", status: "not_requested" },
  { id: "INS-107", activityId: "ACT-0236", activity: "Concrete Walls", zone: "Z02-01", scope: "Concrete", type: "Pour Inspection", dueDate: "2026-07-14", status: "passed" },
];

function daysUntil(dateStr) {
  const today = new Date("2026-07-15");
  const due = new Date(dateStr);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function InspectionsContent() {
  const [areaFilter, setAreaFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");

  const zones = useMemo(() => [...new Set(INSPECTIONS.map((i) => i.zone))].sort(), []);
  const scopes = useMemo(() => [...new Set(INSPECTIONS.map((i) => i.scope))], []);

  const filtered = useMemo(() => INSPECTIONS
    .filter((i) => (areaFilter === "all" || i.zone === areaFilter) && (scopeFilter === "all" || i.scope === scopeFilter))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)), [areaFilter, scopeFilter]);

  const dueSoonCount = INSPECTIONS.filter((i) => daysUntil(i.dueDate) <= 2 && daysUntil(i.dueDate) >= 0 && i.status === "not_requested").length;

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div><div className="text-base font-medium text-gray-900">Inspections</div><div className="text-xs text-gray-500">Pulled from the three-week look-ahead, ordered by due date</div></div>
        <div className="flex items-center gap-2">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400">
            <option value="all">All areas</option>{zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400">
            <option value="all">All scopes</option>{scopes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {dueSoonCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md px-3 py-2">
            <Clock size={14} /> {dueSoonCount} inspection{dueSoonCount > 1 ? "s" : ""} due within 2 days and not yet requested.
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">Activity</th><th className="px-4 py-2 font-normal">Area</th>
              <th className="px-4 py-2 font-normal">Scope</th><th className="px-4 py-2 font-normal">Inspection Type</th>
              <th className="px-4 py-2 font-normal">Due Date</th><th className="px-4 py-2 font-normal">Ready in</th><th className="px-4 py-2 font-normal">Status</th>
            </tr></thead>
            <tbody>
              {filtered.map((i) => {
                const dLeft = daysUntil(i.dueDate);
                const urgent = dLeft <= 2 && i.status === "not_requested";
                return (
                  <tr key={i.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5"><div className="text-gray-900">{i.activity}</div><div className="text-xs text-gray-400">{i.activityId}</div></td>
                    <td className="px-4 py-2.5 text-gray-600">{i.zone}</td>
                    <td className="px-4 py-2.5 text-gray-600">{i.scope}</td>
                    <td className="px-4 py-2.5 text-gray-600">{i.type}</td>
                    <td className="px-4 py-2.5 text-gray-600">{i.dueDate}</td>
                    <td className={`px-4 py-2.5 ${urgent ? "text-red-600 font-medium" : "text-gray-500"}`}>
                      {dLeft < 0 ? `${Math.abs(dLeft)}d overdue` : dLeft === 0 ? "Today" : `${dLeft}d`}
                    </td>
                    <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full border ${INSPECTION_STATUS[i.status].chip}`}>{INSPECTION_STATUS[i.status].label}</span></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-xs">No inspections match this filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}


export default InspectionsContent;
