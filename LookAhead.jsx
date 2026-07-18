import React, { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { STATUS } from "./status.jsx";
import { REAL_SCHEDULE } from "./schedule.js";

// =============================================================================
// MODULE 4 — Three-Week / Multi-Week Look-Ahead
// Real schedule imported from OMSF_3_month_look_ahead_Schedule_Linked.xlsx
// (sheet: "OMSF - 4 week look ahead"). 110 tasks, Area 1/2/3/5, Jul 6 - Sep 11 2026.
// offset/span are calendar-day counts from PROJECT_START — precomputed in Python
// at import time rather than done with JS Date math, to avoid timezone drift.
// =============================================================================
const PROJECT_START = "2026-07-06";
const TODAY_OFFSET = 12; // 2026-07-18, per the current conversation date

const DAY_WIDTH = 15; // px per day in the Gantt timeline
const TOTAL_DAYS = Math.max(...REAL_SCHEDULE.map((t) => t.offset + t.span)) + 3;

// Week tick marks along the top of the timeline, every 7 days from PROJECT_START.
function buildWeekTicks() {
  const start = new Date(PROJECT_START + "T00:00:00");
  const ticks = [];
  for (let d = 0; d <= TOTAL_DAYS; d += 7) {
    const dt = new Date(start);
    dt.setDate(dt.getDate() + d);
    ticks.push({ offset: d, label: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }
  return ticks;
}
const WEEK_TICKS = buildWeekTicks();

function useScheduleRows(filterArea) {
  return useMemo(() => {
    const filtered = filterArea === "all" ? REAL_SCHEDULE : REAL_SCHEDULE.filter((t) => t.area === filterArea);
    // Build ordered groups: Area > Group, preserving first-seen order.
    const groupOrder = [];
    const byGroup = {};
    filtered.forEach((t) => {
      const key = `${t.area}__${t.group}`;
      if (!byGroup[key]) { byGroup[key] = { area: t.area, group: t.group, tasks: [] }; groupOrder.push(key); }
      byGroup[key].tasks.push(t);
    });
    return groupOrder.map((k) => byGroup[k]);
  }, [filterArea]);
}

function LookAheadContent() {
  const [filterArea, setFilterArea] = useState("all");
  const [tab, setTab] = useState("Gantt");
  const [hovered, setHovered] = useState(null);
  const areas = useMemo(() => [...new Set(REAL_SCHEDULE.map((t) => t.area))].sort(), []);
  const groups = useScheduleRows(filterArea);
  const listData = useMemo(
    () => (filterArea === "all" ? REAL_SCHEDULE : REAL_SCHEDULE.filter((t) => t.area === filterArea))
      .slice().sort((a, b) => a.offset - b.offset),
    [filterArea]
  );

  const counts = useMemo(() => {
    const src = filterArea === "all" ? REAL_SCHEDULE : REAL_SCHEDULE.filter((t) => t.area === filterArea);
    return {
      total: src.length,
      completed: src.filter((t) => t.status === "completed").length,
      inProgress: src.filter((t) => t.status === "in_progress").length,
      planned: src.filter((t) => t.status === "planned").length,
    };
  }, [filterArea]);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div>
          <div className="text-base font-medium text-gray-900">Look-Ahead Schedule</div>
          <div className="text-xs text-gray-500">Imported from OMSF_3_month_look_ahead_Schedule_Linked.xlsx · Jul 6 – Sep 11, 2026</div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400">
            <option value="all">All areas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><Download size={13} /> Export</button>
        </div>
      </div>

      <div className="flex items-center gap-5 px-6 border-b border-gray-200 bg-white shrink-0">
        {["Gantt", "List"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`py-2.5 text-xs border-b-2 ${tab === t ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t}</button>
        ))}
        <div className="flex items-center gap-3 ml-auto text-[11px] text-gray-500 py-2.5">
          <span>{counts.total} tasks</span>
          <span className="text-amber-600">{counts.completed} completed</span>
          <span className="text-emerald-600">{counts.inProgress} in progress</span>
          <span className="text-blue-600">{counts.planned} planned</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "Gantt" ? (
          <div style={{ minWidth: TOTAL_DAYS * DAY_WIDTH + 260 }}>
            {/* Timeline header */}
            <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="w-64 shrink-0 px-4 py-2 text-xs text-gray-400 border-r border-gray-100">Area / Group / Task</div>
              <div className="relative flex-1" style={{ height: 32 }}>
                {WEEK_TICKS.map((w) => (
                  <div key={w.offset} className="absolute top-0 h-full border-l border-gray-100 text-[10px] text-gray-400 pl-1 pt-2"
                    style={{ left: w.offset * DAY_WIDTH }}>{w.label}</div>
                ))}
                <div className="absolute top-0 h-full border-l-2 border-red-400" style={{ left: TODAY_OFFSET * DAY_WIDTH }} title="Today — Jul 18, 2026" />
              </div>
            </div>

            {/* Rows grouped by Area > Group */}
            <div className="bg-white">
              {groups.map((g) => (
                <div key={`${g.area}__${g.group}`}>
                  <div className="flex bg-blue-50/60 border-b border-blue-100">
                    <div className="w-64 shrink-0 px-4 py-1.5 text-[11px] font-medium text-blue-900 border-r border-gray-100">{g.area} — {g.group}</div>
                    <div className="flex-1 relative" style={{ height: 26 }} />
                  </div>
                  {g.tasks.map((t, i) => {
                    const s = STATUS[t.status];
                    const isHovered = hovered === `${g.area}__${g.group}__${i}`;
                    return (
                      <div key={i} className="flex border-b border-gray-50">
                        <div className="w-64 shrink-0 px-4 py-2 text-xs text-gray-700 border-r border-gray-100 truncate" title={t.title}>{t.title}</div>
                        <div className="flex-1 relative" style={{ height: 34 }}>
                          <div
                            onMouseEnter={() => setHovered(`${g.area}__${g.group}__${i}`)}
                            onMouseLeave={() => setHovered(null)}
                            className={`absolute top-1.5 h-6 rounded border px-1.5 flex items-center text-[10px] cursor-pointer ${s.bar}`}
                            style={{
                              left: t.offset * DAY_WIDTH,
                              width: Math.max(t.span * DAY_WIDTH - 2, 6),
                              boxShadow: isHovered ? "0 0 0 2px rgba(0,0,0,0.2)" : "none",
                            }}
                            title={`${t.title} · ${t.start} → ${t.end}${t.notes ? " · " + t.notes : ""}`}
                          >
                            {t.span * DAY_WIDTH > 40 && <span className="truncate">{s.label}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white sticky top-0"><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">Area</th><th className="px-4 py-2 font-normal">Group</th>
              <th className="px-4 py-2 font-normal">Task</th><th className="px-4 py-2 font-normal">Start</th>
              <th className="px-4 py-2 font-normal">End</th><th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Notes</th>
            </tr></thead>
            <tbody className="bg-white">
              {listData.map((t, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">{t.area}</td>
                  <td className="px-4 py-2 text-gray-600">{t.group}</td>
                  <td className="px-4 py-2 text-gray-900">{t.title}</td>
                  <td className="px-4 py-2 text-gray-600">{t.start}</td>
                  <td className="px-4 py-2 text-gray-600">{t.end}</td>
                  <td className="px-4 py-2"><span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS[t.status].bar}`}>{STATUS[t.status].label}</span></td>
                  <td className="px-4 py-2 text-gray-400">{t.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center gap-4 px-6 py-2.5 border-t border-gray-200 bg-white shrink-0">
        {["planned","in_progress","completed","delayed"].map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-sm border ${STATUS[key].bar}`} />{STATUS[key].label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
          <span className="w-0.5 h-2.5 bg-red-400" />Today (Jul 18, 2026)
        </div>
      </div>
    </>
  );
}


export default LookAheadContent;
