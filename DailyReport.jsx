import React, { useState } from "react";
import { Users, Camera, Plus, Trash2, Cloud, Sun, CloudRain, Flag, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { STATUS } from "./status.jsx";
import { REAL_SCHEDULE, TODAY_OFFSET, offsetToFullLabel } from "./schedule.js";
import { useDailyLogs, isTaskActiveOnOffset, getFlagState, needsAttention, setTaskStatus, setTaskField, addFlagNote, getEntry } from "./dailyLogStore.js";

// =============================================================================
// MODULE 3 — Daily Report
// Planned Activities now reads directly from the same REAL_SCHEDULE data as
// the Look-Ahead module (today's tasks = whatever is active on TODAY_OFFSET),
// and writes through dailyLogStore.js. This is what makes the automatic
// variance flagging work: an activity scheduled for today that hasn't had a
// status recorded here shows up flagged in both this module and Look-Ahead.
// =============================================================================
const REASON_CHIPS = [
  { label: "Material not delivered", status: "delayed" },
  { label: "Subcontractor no-show", status: "delayed" },
  { label: "Weather", status: "delayed" },
  { label: "Equipment issue", status: "delayed" },
  { label: "Access blocked", status: "delayed" },
  { label: "Cancelled", status: "cancelled" },
  { label: "Other…", status: "delayed" },
];
const DR_SUBCONTRACTOR_OPTIONS = ["Carpentry Sub","Steel Fixer Sub","Concrete Sub","MEP Sub","Masonry Sub","Waterproofing Sub","Electrical Sub","Excavation Sub"];
const DR_ZONE_OPTIONS = ["Z02-01","Z02-02","Z02-03","Z02-04"];
const DR_ACTIVITY_OPTIONS = ["Formwork Walls","Rebar Installation","Concrete Walls","MEP Rough-In","Slab Formwork","Slab Rebar","Concrete Slab","Block Work","Waterproofing"];
const DR_INITIAL_MANPOWER = [
  { sub: "Steel Fixer Sub", zone: "Z02-01", manpower: 6, activity: "Rebar Installation" },
  { sub: "MEP Sub", zone: "Z02-02", manpower: 4, activity: "MEP Rough-In" },
  { sub: "Carpentry Sub", zone: "Z02-03", manpower: 5, activity: "Slab Formwork" },
];

function DailyReportContent() {
  const logSnapshot = useDailyLogs(); // subscribe so this view re-renders when statuses/notes change
  const [selectedOffset, setSelectedOffset] = useState(TODAY_OFFSET);
  const todaysTasks = REAL_SCHEDULE.filter((t) => isTaskActiveOnOffset(t, selectedOffset));
  const urgentTasks = todaysTasks.filter((t) => needsAttention(t, selectedOffset));
  const [manpower, setManpower] = useState(DR_INITIAL_MANPOWER);
  const [unplanned, setUnplanned] = useState([{ desc: "Repair column area", zone: "Z02-01", sub: "Concrete Sub", qty: "1 ea", note: "Client requested" }]);
  const [submitted, setSubmitted] = useState(false);
  const [weather, setWeather] = useState("sunny");
  // Which task's row currently has the "why not?" reason chips open — only
  // one at a time, closed again once a reason is picked.
  const [askingFor, setAskingFor] = useState(null);

  function handleYes(task) {
    setTaskStatus(task.id, "completed", selectedOffset);
    setAskingFor(null);
  }

  function handleNo(task) {
    setAskingFor(task.id);
  }

  function handleReasonChip(task, chip) {
    if (chip.label === "Other…") {
      const text = window.prompt(`Quick answer — why didn't "${task.title}" happen on ${offsetToFullLabel(selectedOffset)}?`, "");
      if (text === null || text.trim() === "") return; // cancelled, leave it open
      setTaskField(task.id, "reportNote", text.trim(), selectedOffset);
      setTaskStatus(task.id, chip.status, selectedOffset);
    } else {
      setTaskField(task.id, "reportNote", chip.label, selectedOffset);
      setTaskStatus(task.id, chip.status, selectedOffset);
    }
    setAskingFor(null);
  }

  function handleFlagClick(task) {
    const existing = getEntry(task.id, selectedOffset).flagNote || "";
    const text = window.prompt(
      `"${task.title}" was scheduled for ${offsetToFullLabel(selectedOffset)} but hasn't been recorded yet.\n\nWhy? (this note will also show up on the Look-Ahead schedule)`,
      existing
    );
    if (text !== null && text.trim() !== "") addFlagNote(task.id, text.trim(), selectedOffset);
  }

  const updateManpower = (idx, field, value) => setManpower((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  const addManpower = () => setManpower((prev) => [...prev, { sub: DR_SUBCONTRACTOR_OPTIONS[0], zone: DR_ZONE_OPTIONS[0], manpower: 1, activity: DR_ACTIVITY_OPTIONS[0] }]);
  const removeManpower = (idx) => setManpower((prev) => prev.filter((_, i) => i !== idx));
  const totalManpower = manpower.reduce((sum, r) => sum + (Number(r.manpower) || 0), 0);
  const addUnplanned = () => setUnplanned((prev) => [...prev, { desc: "", zone: "", sub: "", qty: "", note: "" }]);
  const removeUnplanned = (idx) => setUnplanned((prev) => prev.filter((_, i) => i !== idx));
  const WeatherIcon = { sunny: Sun, cloudy: Cloud, rainy: CloudRain }[weather];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div>
          <div className="text-base font-medium text-gray-900">Daily Report</div>
          <div className="flex items-center gap-2 mt-0.5">
            <button onClick={() => setSelectedOffset((o) => o - 1)} className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft size={13} /></button>
            <span className="text-xs text-gray-500">{offsetToFullLabel(selectedOffset)}</span>
            <button onClick={() => setSelectedOffset((o) => o + 1)} className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight size={13} /></button>
            {selectedOffset !== TODAY_OFFSET && (
              <button onClick={() => setSelectedOffset(TODAY_OFFSET)} className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">Today</button>
            )}
          </div>
        </div>
        <button onClick={() => setSubmitted(true)} className="text-xs px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
          {submitted ? "Report submitted ✓" : "Submit Report"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-900 mb-3">General Information</div>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div><div className="text-gray-500 mb-1">Superintendent</div><div className="text-gray-900">Mohamed — Senior Superintendent</div></div>
            <div>
              <div className="text-gray-500 mb-1">Weather</div>
              <div className="flex items-center gap-2">
                <select value={weather} onChange={(e) => setWeather(e.target.value)} className="border border-gray-200 rounded-md px-2 py-1 text-xs outline-none">
                  <option value="sunny">Sunny, 24°C</option><option value="cloudy">Cloudy, 19°C</option><option value="rainy">Rain, 16°C</option>
                </select>
                <WeatherIcon size={14} className="text-gray-400" />
              </div>
            </div>
            <div><div className="text-gray-500 mb-1">Work Hours</div><div className="text-gray-900">7:00 AM – 5:00 PM</div></div>
            <div><div className="text-gray-500 mb-1">Site Conditions</div><div className="text-gray-900">Good</div></div>
          </div>
          <div className="mt-3">
            <div className="text-gray-500 mb-1 text-xs">Notes</div>
            <textarea className="w-full border border-gray-200 rounded-md p-2 text-xs outline-none focus:border-blue-400" rows={2}
              defaultValue="Good progress on concrete walls. MEP area delayed due to missing materials." />
          </div>
        </div>

        {urgentTasks.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
            <Flag size={13} fill="currentColor" />
            {urgentTasks.length} activit{urgentTasks.length > 1 ? "ies" : "y"} scheduled for today {urgentTasks.length > 1 ? "need" : "needs"} attention — pick a status and/or explain why below.
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">Planned Activities ({todaysTasks.length})</div>
          <table className="w-full text-left">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal"></th>
              <th className="px-4 py-2 font-normal">Activity / Area</th><th className="px-4 py-2 font-normal">Subcontractor</th>
              <th className="px-4 py-2 font-normal">Did this happen today?</th>
            </tr></thead>
            <tbody>
              {todaysTasks.map((t) => {
                const entry = getEntry(t.id, selectedOffset);
                const flagState = getFlagState(t, selectedOffset);
                const rowTone = flagState === "explained" ? "bg-amber-50/50" : flagState !== "none" ? "bg-red-50/40" : "";
                const flagColor = flagState === "explained" ? "text-amber-500 hover:text-amber-700" : "text-red-500 hover:text-red-700";
                const flagTitle = flagState === "explained"
                  ? `Explained — ${entry.reportNote || entry.flagNote}`
                  : flagState === "unexplained"
                  ? "Status recorded, but no explanation yet. Click to add a note."
                  : "Not yet recorded today. Click to add a note.";
                const answeredYes = entry.status === "completed" || entry.status === "in_progress";
                const answeredNo = entry.status && !answeredYes;
                return (
                  <tr key={t.id} className={`border-b border-gray-50 last:border-0 ${rowTone}`}>
                    <td className="px-4 py-2.5">
                      {flagState !== "none" && (
                        <button onClick={() => handleFlagClick(t)} title={flagTitle} className={flagColor}>
                          <Flag size={13} fill={flagState === "explained" ? "currentColor" : entry.flagNote ? "currentColor" : "none"} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2.5"><div className="text-gray-900">{t.title}</div><div className="text-xs text-gray-400">{t.area} — {t.group}</div></td>
                    <td className="px-4 py-2.5 text-gray-600">{t.subcontractor}</td>
                    <td className="px-4 py-2.5">
                      {askingFor === t.id ? (
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {REASON_CHIPS.map((chip) => (
                            <button key={chip.label} onClick={() => handleReasonChip(t, chip)}
                              className="text-[11px] px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                              {chip.label}
                            </button>
                          ))}
                          <button onClick={() => setAskingFor(null)} className="text-[11px] px-2 py-1 text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                      ) : answeredYes ? (
                        <button onClick={() => handleNo(t)} className="flex items-center gap-1.5 text-xs text-emerald-700">
                          <CheckCircle2 size={15} className="text-emerald-500" /> Yes, happened
                        </button>
                      ) : answeredNo ? (
                        <button onClick={() => setAskingFor(t.id)} className="flex items-center gap-1.5 text-xs text-gray-700">
                          <XCircle size={15} className="text-red-400" /> No — {entry.reportNote || STATUS[entry.status].label}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleYes(t)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle2 size={13} /> Yes
                          </button>
                          <button onClick={() => handleNo(t)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50">
                            <XCircle size={13} /> No
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {todaysTasks.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">No activities scheduled for today.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div><div className="font-medium text-gray-900">Subcontractor Manpower</div><div className="text-xs text-gray-400">Who was on site today, where, and on what</div></div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1"><Users size={12} /> {totalManpower} on site</span>
              <button onClick={addManpower} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"><Plus size={13} /> Add</button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">Subcontractor</th><th className="px-4 py-2 font-normal">Working Area</th>
              <th className="px-4 py-2 font-normal">Manpower</th><th className="px-4 py-2 font-normal">Activity</th><th className="px-4 py-2 font-normal"></th>
            </tr></thead>
            <tbody>
              {manpower.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2"><select value={row.sub} onChange={(e) => updateManpower(idx, "sub", e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-400">
                    {DR_SUBCONTRACTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                  <td className="px-4 py-2"><select value={row.zone} onChange={(e) => updateManpower(idx, "zone", e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-400">
                    {DR_ZONE_OPTIONS.map((z) => <option key={z} value={z}>{z}</option>)}</select></td>
                  <td className="px-4 py-2"><input type="number" min={0} value={row.manpower} onChange={(e) => updateManpower(idx, "manpower", Number(e.target.value))}
                    className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-400" /></td>
                  <td className="px-4 py-2"><select value={row.activity} onChange={(e) => updateManpower(idx, "activity", e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-400">
                    {DR_ACTIVITY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></td>
                  <td className="px-4 py-2"><button onClick={() => removeManpower(idx)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                </tr>
              ))}
              {manpower.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-xs">No manpower logged today.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-medium text-gray-900">Unplanned Work</div>
            <button onClick={addUnplanned} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"><Plus size={13} /> Add</button>
          </div>
          <table className="w-full text-left">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">Description</th><th className="px-4 py-2 font-normal">Zone</th>
              <th className="px-4 py-2 font-normal">Subcontractor</th><th className="px-4 py-2 font-normal">Qty</th>
              <th className="px-4 py-2 font-normal">Notes</th><th className="px-4 py-2 font-normal"></th>
            </tr></thead>
            <tbody>
              {unplanned.map((u, idx) => (
                <tr key={idx} className="border-b border-gray-50 last:border-0">
                  {["desc","zone","sub","qty","note"].map((field) => (
                    <td key={field} className="px-4 py-2"><input value={u[field]} onChange={(e) => setUnplanned((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: e.target.value } : row)))}
                      className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-400" /></td>
                  ))}
                  <td className="px-4 py-2"><button onClick={() => removeUnplanned(idx)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                </tr>
              ))}
              {unplanned.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-xs">No unplanned work recorded today.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-900 mb-3">Photos</div>
          <div className="flex gap-3 flex-wrap">
            {[1,2,3].map((i) => <div key={i} className="w-24 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-300"><Camera size={18} /></div>)}
            <div className="w-24 h-20 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-400 cursor-pointer hover:border-blue-300 hover:text-blue-400"><Plus size={18} /></div>
          </div>
        </div>
      </div>
    </>
  );
}


export default DailyReportContent;
