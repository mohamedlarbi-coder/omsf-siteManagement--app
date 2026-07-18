import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, Play, Pause, ChevronLeft, Layers } from "lucide-react";
import { STATUS } from "./status.jsx";

// =============================================================================
// MODULE 2 — Visual Schedule
// =============================================================================
const VS_DAYS = [{ label: "Mon", date: "20 May" }, { label: "Tue", date: "21 May" }, { label: "Wed", date: "22 May" }, { label: "Thu", date: "23 May" }, { label: "Fri", date: "24 May" }];
const VS_ZONES = [
  { id: "Z02-01", name: "Z02-01", points: "40,40 260,40 260,220 40,220" },
  { id: "Z02-02", name: "Z02-02", points: "260,40 460,40 460,220 260,220" },
  { id: "Z02-03", name: "Z02-03", points: "460,40 620,40 620,220 460,220" },
  { id: "Z02-04", name: "Z02-04", points: "150,220 460,220 460,340 150,340" },
];
const VS_SCHEDULE = [
  { "Z02-01": { activity: "Formwork Walls", sub: "Carpentry Sub", status: "completed" }, "Z02-02": { activity: "—", sub: "", status: "not_planned" }, "Z02-03": { activity: "—", sub: "", status: "not_planned" }, "Z02-04": { activity: "—", sub: "", status: "not_planned" } },
  { "Z02-01": { activity: "Rebar Installation", sub: "Steel Fixer Sub", status: "in_progress" }, "Z02-02": { activity: "MEP Rough-In", sub: "MEP Sub", status: "planned" }, "Z02-03": { activity: "—", sub: "", status: "not_planned" }, "Z02-04": { activity: "—", sub: "", status: "not_planned" } },
  { "Z02-01": { activity: "Concrete Walls", sub: "Concrete Sub", status: "completed" }, "Z02-02": { activity: "MEP Rough-In", sub: "MEP Sub", status: "blocked" }, "Z02-03": { activity: "Slab Formwork", sub: "Carpentry Sub", status: "planned" }, "Z02-04": { activity: "—", sub: "", status: "not_planned" } },
  { "Z02-01": { activity: "—", sub: "", status: "not_planned" }, "Z02-02": { activity: "MEP Rough-In", sub: "MEP Sub", status: "delayed" }, "Z02-03": { activity: "Slab Rebar", sub: "Steel Fixer Sub", status: "delayed" }, "Z02-04": { activity: "Block Work", sub: "Masonry Sub", status: "in_progress" } },
  { "Z02-01": { activity: "—", sub: "", status: "not_planned" }, "Z02-02": { activity: "—", sub: "", status: "not_planned" }, "Z02-03": { activity: "Concrete Slab", sub: "Concrete Sub", status: "planned" }, "Z02-04": { activity: "Waterproofing", sub: "Waterproofing Sub", status: "in_progress" } },
];

function VisualScheduleContent() {
  const [dayIndex, setDayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hoveredZone, setHoveredZone] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (playing) intervalRef.current = setInterval(() => setDayIndex((p) => (p + 1) % VS_DAYS.length), 1100);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  const today = VS_SCHEDULE[dayIndex];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div><div className="text-base font-medium text-gray-900">Visual Schedule</div><div className="text-xs text-gray-500">Level 02 Floor Plan · Rev 03</div></div>
        <div className="flex items-center gap-1 text-xs text-gray-500"><Layers size={14} /> A-120 — Rev 03</div>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <button onClick={() => setPlaying((p) => !p)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#0B1B33] text-white">
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? "Pause" : "Play sequence"}
        </button>
        <button onClick={() => setDayIndex((d) => Math.max(0, d - 1))} className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft size={14} /></button>
        <div className="flex gap-1">
          {VS_DAYS.map((d, i) => (
            <button key={d.label} onClick={() => { setPlaying(false); setDayIndex(i); }}
              className={`px-3 py-1.5 rounded-md text-xs border ${i === dayIndex ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {d.label} {d.date}
            </button>
          ))}
        </div>
        <button onClick={() => setDayIndex((d) => Math.min(VS_DAYS.length - 1, d + 1))} className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight size={14} /></button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 flex flex-col">
          <svg viewBox="0 0 660 380" className="w-full flex-1">
            {VS_ZONES.map((zone) => {
              const entry = today[zone.id];
              const style = STATUS[entry?.status || "not_planned"];
              const isHovered = hoveredZone === zone.id;
              return (
                <g key={zone.id}>
                  <polygon points={zone.points} fill={style.fill} stroke={isHovered ? "#1f2937" : style.stroke} strokeWidth={isHovered ? 2.5 : 1.5}
                    onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)} style={{ cursor: "pointer", transition: "all 0.2s" }} />
                  <text x={zone.points.split(" ")[0].split(",")[0] * 1 + 20} y={zone.points.split(" ")[0].split(",")[1] * 1 + 24} className="fill-gray-700 text-[13px] font-medium" pointerEvents="none">{zone.name}</text>
                </g>
              );
            })}
          </svg>
          <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-gray-100 mt-2">
            {["planned","in_progress","completed","delayed","blocked","not_planned"].map((key) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: STATUS[key].fill, borderColor: STATUS[key].stroke }} />
                {STATUS[key].label}
              </div>
            ))}
          </div>
        </div>

        <div className="w-72 border-l border-gray-200 bg-white flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-medium text-gray-900">{VS_DAYS[dayIndex].label} {VS_DAYS[dayIndex].date}</div>
            <div className="text-xs text-gray-400">Activities scheduled today</div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {VS_ZONES.map((zone) => {
              const entry = today[zone.id];
              if (!entry || entry.status === "not_planned") return null;
              const style = STATUS[entry.status];
              return (
                <div key={zone.id} onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{zone.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${style.chip}`}>{style.label}</span>
                  </div>
                  <div className="text-gray-900">{entry.activity}</div>
                  <div className="text-xs text-gray-500">{entry.sub}</div>
                </div>
              );
            })}
            {VS_ZONES.every((z) => today[z.id]?.status === "not_planned") && (
              <div className="px-4 py-8 text-center text-gray-400 text-xs">No activity planned for this day.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


export default VisualScheduleContent;
