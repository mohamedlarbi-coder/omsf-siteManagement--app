import React, { useState, useMemo } from "react";
import { Search, ChevronRight, X, Circle } from "lucide-react";
import { STATUS, StatusChip } from "./status.jsx";

// =============================================================================
// MODULE 1 — Dashboard + Activities
// =============================================================================
const DASH_ACTIVITIES = [
  { id: "ACT-0231", title: "Formwork Walls", zone: "Z02-01", trade: "Concrete", sub: "Carpentry Sub", status: "completed", start: "2026-05-20", finish: "2026-05-20", pct: 100, readiness: 100 },
  { id: "ACT-0234", title: "Rebar Installation", zone: "Z02-01", trade: "Concrete", sub: "Steel Fixer Sub", status: "in_progress", start: "2026-05-20", finish: "2026-05-21", pct: 80, readiness: 90 },
  { id: "ACT-0236", title: "Concrete Walls", zone: "Z02-01", trade: "Concrete", sub: "Concrete Sub", status: "completed", start: "2026-05-21", finish: "2026-05-21", pct: 100, readiness: 100 },
  { id: "ACT-0240", title: "MEP Rough-In", zone: "Z02-02", trade: "Mechanical", sub: "MEP Sub", status: "blocked", start: "2026-05-21", finish: "2026-05-24", pct: 0, readiness: 40 },
  { id: "ACT-0242", title: "Slab Formwork", zone: "Z02-03", trade: "Concrete", sub: "Carpentry Sub", status: "planned", start: "2026-05-22", finish: "2026-05-24", pct: 0, readiness: 65 },
  { id: "ACT-0244", title: "Slab Rebar", zone: "Z02-03", trade: "Concrete", sub: "Steel Fixer Sub", status: "delayed", start: "2026-05-23", finish: "2026-05-25", pct: 20, readiness: 55 },
  { id: "ACT-0248", title: "Block Work", zone: "Z02-04", trade: "Masonry", sub: "Masonry Sub", status: "in_progress", start: "2026-05-24", finish: "2026-05-29", pct: 45, readiness: 100 },
  { id: "ACT-0251", title: "Waterproofing", zone: "Z02-04", trade: "Waterproofing", sub: "Waterproofing Sub", status: "planned", start: "2026-05-27", finish: "2026-05-31", pct: 0, readiness: 70 },
];

function StatCard({ label, value, tone = "default" }) {
  const toneClass = { default: "text-gray-900", danger: "text-red-600", warning: "text-amber-600", success: "text-emerald-600" }[tone];
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-medium ${toneClass}`}>{value}</div>
    </div>
  );
}

function DashboardContent() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => DASH_ACTIVITIES.filter((a) => {
    const q = query.toLowerCase();
    const matchesQuery = a.title.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.zone.toLowerCase().includes(q);
    return matchesQuery && (statusFilter === "all" || a.status === statusFilter);
  }), [query, statusFilter]);

  const counts = useMemo(() => ({
    total: DASH_ACTIVITIES.length,
    completed: DASH_ACTIVITIES.filter((a) => a.status === "completed").length,
    delayed: DASH_ACTIVITIES.filter((a) => a.status === "delayed").length,
    atRisk: DASH_ACTIVITIES.filter((a) => a.readiness < 70 && a.status !== "completed").length,
    open: DASH_ACTIVITIES.filter((a) => a.readiness < 100 && a.status !== "completed").length,
  }), []);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div>
          <div className="text-base font-medium text-gray-900">Dashboard</div>
          <div className="text-xs text-gray-500">OMSF — Main Maintenance Building · Level 02</div>
        </div>
        <div className="text-xs text-gray-500">Wed, 15 Jul 2026</div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-3 flex-wrap">
            <StatCard label="Total activities" value={counts.total} />
            <StatCard label="Completed" value={counts.completed} tone="success" />
            <StatCard label="Delayed" value={counts.delayed} tone="danger" />
            <StatCard label="At risk (readiness < 70%)" value={counts.atRisk} tone="warning" />
            <StatCard label="Open readiness items" value={counts.open} tone="warning" />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="font-medium text-gray-900">Activities</div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activity, ID, zone"
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md w-56 outline-none focus:border-blue-400" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400">
                  <option value="all">All statuses</option>
                  {Object.entries(STATUS).filter(([k]) => ["planned","in_progress","completed","delayed","blocked"].includes(k)).map(([key, s]) => (
                    <option key={key} value={key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-2 font-normal">Activity</th>
                  <th className="px-4 py-2 font-normal">Zone</th>
                  <th className="px-4 py-2 font-normal">Subcontractor</th>
                  <th className="px-4 py-2 font-normal">Planned finish</th>
                  <th className="px-4 py-2 font-normal">Readiness</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                  <th className="px-4 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-2.5"><div className="text-gray-900">{a.title}</div><div className="text-xs text-gray-400">{a.id}</div></td>
                    <td className="px-4 py-2.5 text-gray-600">{a.zone}</td>
                    <td className="px-4 py-2.5 text-gray-600">{a.sub}</td>
                    <td className="px-4 py-2.5 text-gray-600">{a.finish}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-400" style={{ width: `${a.readiness}%` }} /></div>
                        <span className="text-xs text-gray-500">{a.readiness}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><StatusChip status={a.status} /></td>
                    <td className="px-4 py-2.5 text-gray-300"><ChevronRight size={16} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-xs">No activities match this search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div><div className="font-medium text-gray-900">{selected.title}</div><div className="text-xs text-gray-400">{selected.id} · {selected.zone}</div></div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto text-xs">
              <StatusChip status={selected.status} />
              <div className="grid grid-cols-2 gap-y-2 text-gray-500">
                <div>Trade</div><div className="text-gray-900">{selected.trade}</div>
                <div>Subcontractor</div><div className="text-gray-900">{selected.sub}</div>
                <div>Planned start</div><div className="text-gray-900">{selected.start}</div>
                <div>Planned finish</div><div className="text-gray-900">{selected.finish}</div>
                <div>% complete</div><div className="text-gray-900">{selected.pct}%</div>
                <div>Readiness</div><div className="text-gray-900">{selected.readiness}%</div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="text-gray-500 mb-1">Readiness checklist</div>
                <div className="space-y-1.5">
                  {["Drawing approved", "Material available", "Predecessor complete", "Inspection requested"].map((r, i) => (
                    <div key={r} className="flex items-center gap-2 text-gray-700">
                      <Circle size={10} className={i < Math.round(selected.readiness / 25) ? "text-emerald-500 fill-emerald-500" : "text-gray-300"} />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


export default DashboardContent;
