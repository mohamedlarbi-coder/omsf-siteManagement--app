import React, { useState } from "react";
import { Users, Camera, Plus, Trash2, Cloud, Sun, CloudRain } from "lucide-react";
import { STATUS } from "./status.jsx";

// =============================================================================
// MODULE 3 — Daily Report
// =============================================================================
const DR_STATUS_OPTIONS = ["not_started","in_progress","completed","partially_completed","delayed"];
const DR_INITIAL_PLANNED = [
  { id: "ACT-0234", title: "Rebar Installation", zone: "Z02-01", sub: "Steel Fixer Sub", unit: "kg", plannedQty: 2500, actualQty: 2000, status: "in_progress", note: "" },
  { id: "ACT-0236", title: "Concrete Walls", zone: "Z02-01", sub: "Concrete Sub", unit: "m³", plannedQty: 30, actualQty: 30, status: "completed", note: "" },
  { id: "ACT-0240", title: "MEP Rough-In", zone: "Z02-02", sub: "MEP Sub", unit: "%", plannedQty: 100, actualQty: 0, status: "not_started", note: "Material not delivered" },
  { id: "ACT-0242", title: "Slab Formwork", zone: "Z02-03", sub: "Carpentry Sub", unit: "m²", plannedQty: 120, actualQty: 40, status: "partially_completed", note: "" },
];
const DR_SUBCONTRACTOR_OPTIONS = ["Carpentry Sub","Steel Fixer Sub","Concrete Sub","MEP Sub","Masonry Sub","Waterproofing Sub","Electrical Sub","Excavation Sub"];
const DR_ZONE_OPTIONS = ["Z02-01","Z02-02","Z02-03","Z02-04"];
const DR_ACTIVITY_OPTIONS = ["Formwork Walls","Rebar Installation","Concrete Walls","MEP Rough-In","Slab Formwork","Slab Rebar","Concrete Slab","Block Work","Waterproofing"];
const DR_INITIAL_MANPOWER = [
  { sub: "Steel Fixer Sub", zone: "Z02-01", manpower: 6, activity: "Rebar Installation" },
  { sub: "MEP Sub", zone: "Z02-02", manpower: 4, activity: "MEP Rough-In" },
  { sub: "Carpentry Sub", zone: "Z02-03", manpower: 5, activity: "Slab Formwork" },
];

function DR_StatusSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`text-[11px] px-2 py-1 rounded-full border outline-none cursor-pointer ${STATUS[value].chip}`}>
      {DR_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{STATUS[v].label}</option>)}
    </select>
  );
}

function DailyReportContent() {
  const [planned, setPlanned] = useState(DR_INITIAL_PLANNED);
  const [manpower, setManpower] = useState(DR_INITIAL_MANPOWER);
  const [unplanned, setUnplanned] = useState([{ desc: "Repair column area", zone: "Z02-01", sub: "Concrete Sub", qty: "1 ea", note: "Client requested" }]);
  const [submitted, setSubmitted] = useState(false);
  const [weather, setWeather] = useState("sunny");

  const updateActivity = (id, field, value) => setPlanned((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  const updateManpower = (idx, field, value) => setManpower((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  const addManpower = () => setManpower((prev) => [...prev, { sub: DR_SUBCONTRACTOR_OPTIONS[0], zone: DR_ZONE_OPTIONS[0], manpower: 1, activity: DR_ACTIVITY_OPTIONS[0] }]);
  const removeManpower = (idx) => setManpower((prev) => prev.filter((_, i) => i !== idx));
  const totalManpower = manpower.reduce((sum, r) => sum + (Number(r.manpower) || 0), 0);
  const addUnplanned = () => setUnplanned((prev) => [...prev, { desc: "", zone: "", sub: "", qty: "", note: "" }]);
  const removeUnplanned = (idx) => setUnplanned((prev) => prev.filter((_, i) => i !== idx));
  const pct = (a) => Math.round((a.actualQty / a.plannedQty) * 100) || 0;
  const WeatherIcon = { sunny: Sun, cloudy: Cloud, rainy: CloudRain }[weather];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div><div className="text-base font-medium text-gray-900">Daily Report</div><div className="text-xs text-gray-500">Wednesday, 15 Jul 2026</div></div>
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

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">Planned Activities ({planned.length})</div>
          <table className="w-full text-left">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">Activity / Zone</th><th className="px-4 py-2 font-normal">Subcontractor</th>
              <th className="px-4 py-2 font-normal">Planned Qty</th><th className="px-4 py-2 font-normal">Actual Qty</th>
              <th className="px-4 py-2 font-normal">Status</th><th className="px-4 py-2 font-normal">%</th><th className="px-4 py-2 font-normal">Notes</th>
            </tr></thead>
            <tbody>
              {planned.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2.5"><div className="text-gray-900">{a.title}</div><div className="text-xs text-gray-400">{a.zone}</div></td>
                  <td className="px-4 py-2.5 text-gray-600">{a.sub}</td>
                  <td className="px-4 py-2.5 text-gray-600">{a.plannedQty} {a.unit}</td>
                  <td className="px-4 py-2.5"><input type="number" value={a.actualQty} onChange={(e) => updateActivity(a.id, "actualQty", Number(e.target.value))}
                    className="w-20 border border-gray-200 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-400" /></td>
                  <td className="px-4 py-2.5"><DR_StatusSelect value={a.status} onChange={(v) => updateActivity(a.id, "status", v)} /></td>
                  <td className="px-4 py-2.5 text-gray-600">{pct(a)}%</td>
                  <td className="px-4 py-2.5"><input value={a.note} onChange={(e) => updateActivity(a.id, "note", e.target.value)} placeholder="—"
                    className="w-32 border border-gray-200 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-400 placeholder:text-gray-300" /></td>
                </tr>
              ))}
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
