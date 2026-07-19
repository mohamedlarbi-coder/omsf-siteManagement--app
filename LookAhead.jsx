import React, { useState, useMemo } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
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

const WINDOW_OPTIONS = [
  { value: "1", label: "1 Week", days: 7 },
  { value: "2", label: "2 Weeks", days: 14 },
  { value: "3", label: "3 Weeks", days: 21 },
  { value: "4", label: "4 Weeks", days: 28 },
  { value: "full", label: "Full Schedule", days: null },
];

const DAY_WIDTH = 15; // px per day in the Gantt timeline
const TOTAL_DAYS = Math.max(...REAL_SCHEDULE.map((t) => t.offset + t.span)) + 3;

function offsetToLabel(offset) {
  const dt = new Date(PROJECT_START + "T00:00:00");
  dt.setDate(dt.getDate() + offset);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Week tick marks along the top of the timeline, every 7 days from a given start.
function buildWeekTicks(rangeStart, rangeDays) {
  const ticks = [];
  for (let d = 0; d <= rangeDays; d += 7) {
    ticks.push({ offset: d, label: offsetToLabel(rangeStart + d) });
  }
  return ticks;
}

function useScheduleRows(tasks) {
  return useMemo(() => {
    const groupOrder = [];
    const byGroup = {};
    tasks.forEach((t) => {
      const key = `${t.area}__${t.group}`;
      if (!byGroup[key]) { byGroup[key] = { area: t.area, group: t.group, tasks: [] }; groupOrder.push(key); }
      byGroup[key].tasks.push(t);
    });
    return groupOrder.map((k) => byGroup[k]);
  }, [tasks]);
}

function LookAheadContent() {
  const [filterArea, setFilterArea] = useState("all");
  const [tab, setTab] = useState("Gantt");
  const [hovered, setHovered] = useState(null);
  const [windowChoice, setWindowChoice] = useState("4"); // "1".."4" or "full"
  const activeWindow = WINDOW_OPTIONS.find((w) => w.value === windowChoice);
  const isFull = windowChoice === "full";
  // windowStart snaps to the Monday of the current week so the view always
  // starts on a clean week boundary rather than mid-week on "today".
  const [windowStart, setWindowStart] = useState(TODAY_OFFSET - (TODAY_OFFSET % 7));

  const areas = useMemo(() => [...new Set(REAL_SCHEDULE.map((t) => t.area))].sort(), []);

  const byArea = useMemo(
    () => (filterArea === "all" ? REAL_SCHEDULE : REAL_SCHEDULE.filter((t) => t.area === filterArea)),
    [filterArea]
  );

  const rangeStart = isFull ? 0 : windowStart;
  const rangeDays = isFull ? TOTAL_DAYS : activeWindow.days;

  // A task is "in range" if its [start, end) span overlaps the visible window.
  const visibleTasks = useMemo(() => {
    if (isFull) return byArea;
    const rangeEnd = windowStart + rangeDays;
    return byArea.filter((t) => t.offset < rangeEnd && t.offset + t.span > windowStart);
  }, [byArea, isFull, windowStart, rangeDays]);

  const groups = useScheduleRows(visibleTasks);
  const listData = useMemo(() => visibleTasks.slice().sort((a, b) => a.offset - b.offset), [visibleTasks]);
  const weekTicks = useMemo(() => buildWeekTicks(rangeStart, rangeDays), [rangeStart, rangeDays]);

  const counts = useMemo(() => ({
    total: visibleTasks.length,
    completed: visibleTasks.filter((t) => t.status === "completed").length,
    inProgress: visibleTasks.filter((t) => t.status === "in_progress").length,
    planned: visibleTasks.filter((t) => t.status === "planned").length,
  }), [visibleTasks]);

  const windowLabel = !isFull ? `${offsetToLabel(windowStart)} – ${offsetToLabel(windowStart + rangeDays - 1)}` : "";

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div>
          <div className="text-base font-medium text-gray-900">Look-Ahead Schedule</div>
          <div className="text-xs text-gray-500">
            {!isFull ? `${activeWindow.label} · ${windowLabel}, 2026` : "Full Schedule · Jul 6 – Sep 11, 2026"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400">
            <option value="all">All areas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><Download size={13} /> Export</button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-gray-200 bg-white shrink-0">
        <span className="text-xs text-gray-500">Look-ahead window:</span>
        <select
          value={windowChoice}
          onChange={(e) => setWindowChoice(e.target.value)}
          className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400"
        >
          {WINDOW_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
        </select>

        {!isFull && (
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => setWindowStart((w) => w - 7)} className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft size={14} /></button>
            <button
              onClick={() => setWindowStart(TODAY_OFFSET - (TODAY_OFFSET % 7))}
              className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
            >Today</button>
            <button onClick={() => setWindowStart((w) => w + 7)} className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight size={14} /></button>
          </div>
        )}
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
          <div style={{ minWidth: rangeDays * DAY_WIDTH + 260 }}>
            {/* Timeline header */}
            <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="w-64 shrink-0 px-4 py-2 text-xs text-gray-400 border-r border-gray-100">Area / Group / Task</div>
              <div className="relative flex-1" style={{ height: 32 }}>
                {weekTicks.map((w) => (
                  <div key={w.offset} className="absolute top-0 h-full border-l border-gray-100 text-[10px] text-gray-400 pl-1 pt-2"
                    style={{ left: w.offset * DAY_WIDTH }}>{w.label}</div>
                ))}
                {TODAY_OFFSET >= rangeStart && TODAY_OFFSET <= rangeStart + rangeDays && (
                  <div className="absolute top-0 h-full border-l-2 border-red-400" style={{ left: (TODAY_OFFSET - rangeStart) * DAY_WIDTH }} title="Today — Jul 18, 2026" />
                )}
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
                    // Clip the bar to the visible range so tasks that start
                    // before the window (or end after it) still render sensibly.
                    const barStart = Math.max(t.offset, rangeStart);
                    const barEnd = Math.min(t.offset + t.span, rangeStart + rangeDays);
                    const left = (barStart - rangeStart) * DAY_WIDTH;
                    const width = Math.max((barEnd - barStart) * DAY_WIDTH - 2, 6);
                    return (
                      <div key={i} className="flex border-b border-gray-50">
                        <div className="w-64 shrink-0 px-4 py-2 text-xs text-gray-700 border-r border-gray-100 truncate" title={t.title}>{t.title}</div>
                        <div className="flex-1 relative" style={{ height: 34 }}>
                          <div
                            onMouseEnter={() => setHovered(`${g.area}__${g.group}__${i}`)}
                            onMouseLeave={() => setHovered(null)}
                            className={`absolute top-1.5 h-6 rounded border px-1.5 flex items-center text-[10px] cursor-pointer ${s.bar}`}
                            style={{
                              left,
                              width,
                              boxShadow: isHovered ? "0 0 0 2px rgba(0,0,0,0.2)" : "none",
                            }}
                            title={`${t.title} · ${t.start} → ${t.end}${t.notes ? " · " + t.notes : ""}`}
                          >
                            {width > 40 && <span className="truncate">{s.label}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {groups.length === 0 && (
                <div className="px-4 py-10 text-center text-gray-400 text-xs">No activities scheduled in this 4-week window.</div>
              )}
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
