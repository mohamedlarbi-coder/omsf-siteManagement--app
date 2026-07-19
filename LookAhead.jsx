import React, { useState, useMemo, useRef } from "react";
import { Download, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { STATUS } from "./status.jsx";
import { REAL_SCHEDULE, PROJECT_START, TODAY_OFFSET } from "./schedule.js";
import { useDailyLogs, getFlagState, needsAttention, addFlagNote, getEntry, getAllCustomActivities } from "./dailyLogStore.js";

// =============================================================================
// MODULE 4 — Three-Week / Multi-Week Look-Ahead
// Real schedule imported from OMSF_3_month_look_ahead_Schedule_Linked.xlsx
// (sheet: "OMSF - 4 week look ahead"). 110 tasks, Area 1/2/3/5, Jul 6 - Sep 11 2026.
// offset/span are calendar-day counts from PROJECT_START — precomputed in Python
// at import time rather than done with JS Date math, to avoid timezone drift.
// =============================================================================

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

function offsetToWeekdayShort(offset) {
  const dt = new Date(PROJECT_START + "T00:00:00");
  dt.setDate(dt.getDate() + offset);
  return dt.toLocaleDateString("en-US", { weekday: "short" });
}

function offsetToDayNum(offset) {
  const dt = new Date(PROJECT_START + "T00:00:00");
  dt.setDate(dt.getDate() + offset);
  return dt.getDate();
}

// Week tick marks along the top of the timeline, every 7 days from a given start.
function buildWeekTicks(rangeStart, rangeDays) {
  const ticks = [];
  for (let d = 0; d <= rangeDays; d += 7) {
    ticks.push({ offset: d, label: offsetToLabel(rangeStart + d) });
  }
  return ticks;
}

// One entry per calendar day in the visible range — used for the responsive
// day-by-day header when a short window (1-4 weeks) is selected, so each
// day gets its own labeled column instead of just a weekly tick mark.
function buildDayHeaders(rangeStart, rangeDays) {
  const days = [];
  for (let d = 0; d < rangeDays; d++) {
    days.push({ offset: d, weekday: offsetToWeekdayShort(rangeStart + d), dayNum: offsetToDayNum(rangeStart + d) });
  }
  return days;
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
  const logSnapshot = useDailyLogs(); // subscribe so this view re-renders when Daily Report entries change
  const [filterArea, setFilterArea] = useState("all");
  const [filterSub, setFilterSub] = useState("all");
  const [tab, setTab] = useState("Gantt");
  const [hovered, setHovered] = useState(null);
  const [windowChoice, setWindowChoice] = useState("4"); // "1".."4" or "full"
  const activeWindow = WINDOW_OPTIONS.find((w) => w.value === windowChoice);
  const isFull = windowChoice === "full";
  // windowStart snaps to the Monday of the current week so the view always
  // starts on a clean week boundary rather than mid-week on "today".
  const [windowStart, setWindowStart] = useState(TODAY_OFFSET - (TODAY_OFFSET % 7));

  // Ad-hoc activities added from the Daily Report (e.g. maintenance, a
  // client walk-through) get merged in here so they show up permanently in
  // Look-Ahead too, not just on the one day they were typed into.
  const fullSchedule = useMemo(() => [...REAL_SCHEDULE, ...getAllCustomActivities()], [logSnapshot]);

  const areas = useMemo(() => [...new Set(fullSchedule.map((t) => t.area))].sort(), [fullSchedule]);
  const subcontractors = useMemo(() => [...new Set(fullSchedule.map((t) => t.subcontractor))].sort(), [fullSchedule]);

  const byArea = useMemo(() => {
    let src = filterArea === "all" ? fullSchedule : fullSchedule.filter((t) => t.area === filterArea);
    if (filterSub !== "all") src = src.filter((t) => t.subcontractor === filterSub);
    return src;
  }, [fullSchedule, filterArea, filterSub]);

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
  // Short windows (1-4 weeks) get a fully responsive, day-by-day layout that
  // fills the screen width instead of a fixed pixel-per-day scrollable strip —
  // this is the "zoom in" behavior: fewer days visible means each one gets
  // more horizontal room automatically.
  const isResponsive = !isFull;
  const dayHeaders = useMemo(() => (isResponsive ? buildDayHeaders(rangeStart, rangeDays) : []), [isResponsive, rangeStart, rangeDays]);

  const counts = useMemo(() => ({
    total: visibleTasks.length,
    completed: visibleTasks.filter((t) => t.status === "completed").length,
    inProgress: visibleTasks.filter((t) => t.status === "in_progress").length,
    planned: visibleTasks.filter((t) => t.status === "planned").length,
  }), [visibleTasks]);

  // Flags are based on the FULL schedule (not just the filtered/visible
  // slice) so the count is always accurate regardless of which window or
  // area filter happens to be selected.
  const todaysFlags = useMemo(() => fullSchedule.filter((t) => needsAttention(t)), [fullSchedule]);

  const windowLabel = !isFull ? `${offsetToLabel(windowStart)} – ${offsetToLabel(windowStart + rangeDays - 1)}` : "";

  function handleFlagClick(task) {
    const existing = getEntry(task.id).flagNote || "";
    const text = window.prompt(
      `"${task.title}" was scheduled for today but hasn't been recorded in the Daily Report yet.\n\nWhy? (this note will show up in both the Look-Ahead and the Daily Report)`,
      existing
    );
    if (text !== null && text.trim() !== "") addFlagNote(task.id, text.trim());
  }

  const contentRef = useRef(null);

  async function handleExportPdf() {
    const node = contentRef.current;
    if (!node) return;
    // Loaded on demand (not in the main bundle) since PDF export is an
    // occasional action, not something every page load needs.
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);

    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;

    const title = !isFull
      ? `OMSF Look-Ahead — ${activeWindow.label} (${windowLabel}, 2026)`
      : "OMSF Look-Ahead — Full Schedule (Jul 6 – Sep 11, 2026)";
    const subtitle = `Area: ${filterArea === "all" ? "All" : filterArea} · Subcontractor: ${filterSub === "all" ? "All" : filterSub} · Exported ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`;

    pdf.setFontSize(13);
    pdf.text(title, margin, margin + 4);
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(subtitle, margin, margin + 9);

    // Fit the captured image to the page width, then slice it across as
    // many pages as needed if the content is taller than one page.
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const contentTop = margin + 13;
    const usablePerPage = pageHeight - 13;
    const totalPages = Math.max(1, Math.ceil(imgHeight / usablePerPage));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }
      const sliceCanvas = document.createElement("canvas");
      const pxPerMm = canvas.width / imgWidth;
      const sliceHeightPx = Math.min(usablePerPage * pxPerMm, canvas.height - page * usablePerPage * pxPerMm);
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, page * usablePerPage * pxPerMm, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
      const sliceData = sliceCanvas.toDataURL("image/png");
      const sliceHeightMm = (sliceHeightPx * imgWidth) / canvas.width;
      pdf.addImage(sliceData, "PNG", margin, page === 0 ? contentTop : margin, imgWidth, sliceHeightMm);
    }

    const suffix = isFull ? "full-schedule" : `window-${offsetToLabel(windowStart).replace(" ", "-")}`;
    pdf.save(`omsf-look-ahead-${suffix}.pdf`);
  }

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
          <select value={filterSub} onChange={(e) => setFilterSub(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400">
            <option value="all">All subcontractors</option>
            {subcontractors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><Download size={13} /> Export PDF</button>
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

      {todaysFlags.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-2 bg-red-50 border-b border-red-100 text-xs text-red-700 shrink-0">
          <Flag size={13} fill="currentColor" />
          {todaysFlags.length} activit{todaysFlags.length > 1 ? "ies" : "y"} scheduled today {todaysFlags.length > 1 ? "need" : "needs"} attention — click the 🚩 on the row to add a note.
        </div>
      )}

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
        <div ref={contentRef} className="bg-white">
        {tab === "Gantt" ? (
          <div style={isResponsive ? { minWidth: "100%" } : { minWidth: rangeDays * DAY_WIDTH + 260 }}>
            {/* Timeline header */}
            <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="w-64 shrink-0 px-4 py-2 text-xs text-gray-400 border-r border-gray-100">Area / Group / Task</div>
              {isResponsive ? (
                <div className="relative flex-1 flex" style={{ height: 36 }}>
                  {dayHeaders.map((d) => (
                    <div key={d.offset} className={`flex-1 flex flex-col items-center justify-center text-[10px] border-r border-gray-100 last:border-r-0 ${rangeStart + d.offset === TODAY_OFFSET ? "bg-red-50" : ""}`}>
                      <div className="text-gray-400">{d.weekday}</div>
                      <div className={`font-medium ${rangeStart + d.offset === TODAY_OFFSET ? "text-red-600" : "text-gray-700"}`}>{d.dayNum}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative flex-1" style={{ height: 32 }}>
                  {weekTicks.map((w) => (
                    <div key={w.offset} className="absolute top-0 h-full border-l border-gray-100 text-[10px] text-gray-400 pl-1 pt-2"
                      style={{ left: w.offset * DAY_WIDTH }}>{w.label}</div>
                  ))}
                  {TODAY_OFFSET >= rangeStart && TODAY_OFFSET <= rangeStart + rangeDays && (
                    <div className="absolute top-0 h-full border-l-2 border-red-400" style={{ left: (TODAY_OFFSET - rangeStart) * DAY_WIDTH }} title="Today — Jul 18, 2026" />
                  )}
                </div>
              )}
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
                    const flagState = getFlagState(t);
                    const flagged = flagState !== "none";
                    const flagExplained = flagState === "explained";
                    const flagNote = getEntry(t.id).flagNote || getEntry(t.id).reportNote;
                    // Clip the bar to the visible range so tasks that start
                    // before the window (or end after it) still render sensibly.
                    const barStart = Math.max(t.offset, rangeStart);
                    const barEnd = Math.min(t.offset + t.span, rangeStart + rangeDays);
                    const leftPct = ((barStart - rangeStart) / rangeDays) * 100;
                    const widthPct = ((barEnd - barStart) / rangeDays) * 100;
                    const left = isResponsive ? `${leftPct}%` : (barStart - rangeStart) * DAY_WIDTH;
                    const width = isResponsive ? `calc(${widthPct}% - 4px)` : Math.max((barEnd - barStart) * DAY_WIDTH - 2, 6);
                    // Rough estimate of rendered pixel width, just to decide whether
                    // there's room to show the status label text inside the bar.
                    const roughPx = isResponsive ? widthPct * 8 : (barEnd - barStart) * DAY_WIDTH;
                    return (
                      <div key={i} className={`flex border-b border-gray-50 ${flagExplained ? "bg-amber-50/40" : flagged ? "bg-red-50/40" : ""}`}>
                        <div className="w-64 shrink-0 px-4 py-2 text-xs text-gray-700 border-r border-gray-100 truncate flex items-center gap-1.5" title={t.title}>
                          {flagged && (
                            <button onClick={() => handleFlagClick(t)} title={flagNote ? `${flagExplained ? "Explained" : "Flagged"} — ${flagNote}` : "Flagged: scheduled today, not yet in Daily Report. Click to add a note."} className={flagExplained ? "shrink-0 text-amber-500 hover:text-amber-700" : "shrink-0 text-red-500 hover:text-red-700"}>
                              <Flag size={12} fill={flagExplained || flagNote ? "currentColor" : "none"} />
                            </button>
                          )}
                          <span className="truncate">{t.title}</span>
                        </div>
                        <div className="flex-1 relative" style={{ height: isResponsive ? 44 : 34 }}>
                          {isResponsive && dayHeaders.map((d) => (
                            <div key={d.offset} className="absolute top-0 h-full border-r border-gray-50 last:border-r-0" style={{ left: `${(d.offset / rangeDays) * 100}%`, width: `${(1 / rangeDays) * 100}%` }} />
                          ))}
                          <div
                            onMouseEnter={() => setHovered(`${g.area}__${g.group}__${i}`)}
                            onMouseLeave={() => setHovered(null)}
                            className={`absolute top-1.5 rounded border px-1.5 flex flex-col justify-center cursor-pointer ${s.bar} ${flagExplained ? "ring-2 ring-amber-400" : flagged ? "ring-2 ring-red-400" : ""}`}
                            style={{
                              left,
                              width,
                              height: isResponsive ? 38 : 24,
                              boxShadow: isHovered ? "0 0 0 2px rgba(0,0,0,0.2)" : "none",
                            }}
                            title={`${t.title} · ${t.start} → ${t.end}${t.notes ? " · " + t.notes : ""}${flagged ? (flagExplained ? " · ⚠ Variance (explained)" : " · ⚠ Needs attention") : ""}`}
                          >
                            {isResponsive ? (
                              <>
                                <span className="truncate text-[10px] font-medium leading-tight">{t.title}</span>
                                <span className="truncate text-[9px] opacity-70 leading-tight">{s.label}{t.notes ? ` · ${t.notes}` : ""}</span>
                              </>
                            ) : (
                              roughPx > 40 && <span className="truncate text-[10px]">{s.label}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {groups.length === 0 && (
                <div className="px-4 py-10 text-center text-gray-400 text-xs">No activities scheduled in this window.</div>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white sticky top-0"><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal"></th>
              <th className="px-4 py-2 font-normal">Area</th><th className="px-4 py-2 font-normal">Group</th>
              <th className="px-4 py-2 font-normal">Task</th><th className="px-4 py-2 font-normal">Subcontractor</th>
              <th className="px-4 py-2 font-normal">Start</th>
              <th className="px-4 py-2 font-normal">End</th><th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Notes</th>
            </tr></thead>
            <tbody className="bg-white">
              {listData.map((t, i) => {
                const flagState = getFlagState(t);
                const flagged = flagState !== "none";
                const flagExplained = flagState === "explained";
                const flagNote = getEntry(t.id).flagNote || getEntry(t.id).reportNote;
                return (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 ${flagExplained ? "bg-amber-50/40" : flagged ? "bg-red-50/40" : ""}`}>
                    <td className="px-4 py-2">
                      {flagged && (
                        <button onClick={() => handleFlagClick(t)} title={flagNote ? `${flagExplained ? "Explained" : "Flagged"} — ${flagNote}` : "Flagged: scheduled today, not yet in Daily Report. Click to add a note."} className={flagExplained ? "text-amber-500 hover:text-amber-700" : "text-red-500 hover:text-red-700"}>
                          <Flag size={13} fill={flagExplained || flagNote ? "currentColor" : "none"} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{t.area}</td>
                    <td className="px-4 py-2 text-gray-600">{t.group}</td>
                    <td className="px-4 py-2 text-gray-900">{t.title}</td>
                    <td className="px-4 py-2 text-gray-600">{t.subcontractor}</td>
                    <td className="px-4 py-2 text-gray-600">{t.start}</td>
                    <td className="px-4 py-2 text-gray-600">{t.end}</td>
                    <td className="px-4 py-2"><span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS[t.status].bar}`}>{STATUS[t.status].label}</span></td>
                    <td className="px-4 py-2 text-gray-400">{t.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>
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
