import React, { useState, useMemo } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Layers, Flag } from "lucide-react";
import { STATUS } from "./status.jsx";
import { REAL_SCHEDULE, TODAY_OFFSET, offsetToFullLabel } from "./schedule.js";
import { useDailyLogs, isTaskActiveOnOffset, getFlagState, getAllCustomActivities } from "./dailyLogStore.js";
import sitePlan from "./site-plan.png";

// =============================================================================
// MODULE 2 — Visual Schedule
// Real floor plan (OMSF Maintenance Building — Overall Slab on Grade and
// Foundation Plan, Drawing 1414_RSM-RCD-NC-NM1-OPL-BST1-11001) with the 5
// real Areas traced from the drawing's own colour-coded regions. Zone
// polygons are pixel coordinates in the 1000x1520 cropped image — see the
// data-model conversation for how they were extracted (colour-matching +
// connected-component analysis on the source PDF).
// =============================================================================

const ZONES = [
  { id: "Area 1", points: "341,966 537,966 537,1280 341,1280" },
  { id: "Area 2", points: "335,225 541,225 541,971 335,971" },
  { id: "Area 3", points: "529,226 770,226 770,793 529,793" },
  { id: "Area 4", points: "528,782 702,782 702,1284 528,1284" },
  { id: "Area 5", points: "246,591 342,591 342,1153 246,1153" },
];

// A handful of evenly-spaced days around today, so the strip is relevant
// without needing full look-ahead-style window controls.
const DAY_OFFSETS = [TODAY_OFFSET - 2, TODAY_OFFSET - 1, TODAY_OFFSET, TODAY_OFFSET + 1, TODAY_OFFSET + 2];

function zoneStatusFor(areaId, offset, allTasks) {
  const tasks = allTasks.filter((t) => t.area === areaId && isTaskActiveOnOffset(t, offset));
  if (tasks.length === 0) return { key: "not_planned", tasks: [] };
  if (tasks.some((t) => getFlagState(t, offset) !== "none" && getFlagState(t, offset) !== "explained")) {
    return { key: "delayed", tasks };
  }
  if (tasks.some((t) => t.status === "in_progress")) return { key: "in_progress", tasks };
  if (tasks.every((t) => t.status === "completed")) return { key: "completed", tasks };
  return { key: "planned", tasks };
}

export default function VisualSchedule() {
  const logSnapshot = useDailyLogs(); // re-render when Daily Report entries change
  const [dayOffset, setDayOffset] = useState(TODAY_OFFSET);
  const [playing, setPlaying] = useState(false);
  const [hoveredZone, setHoveredZone] = useState(null);

  const allTasks = useMemo(() => [...REAL_SCHEDULE, ...getAllCustomActivities()], [logSnapshot]);

  React.useEffect(() => {
    if (!playing) return;
    const idx = DAY_OFFSETS.indexOf(dayOffset);
    const t = setInterval(() => {
      setDayOffset((prev) => {
        const i = DAY_OFFSETS.indexOf(prev);
        return DAY_OFFSETS[(i + 1) % DAY_OFFSETS.length];
      });
    }, 1300);
    return () => clearInterval(t);
  }, [playing]);

  const zoneData = useMemo(() => {
    const map = {};
    ZONES.forEach((z) => { map[z.id] = zoneStatusFor(z.id, dayOffset, allTasks); });
    return map;
  }, [dayOffset, allTasks]);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div>
          <div className="text-base font-medium text-gray-900">Visual Schedule</div>
          <div className="text-xs text-gray-500">OMSF Maintenance Building — Overall Slab on Grade &amp; Foundation Plan</div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500"><Layers size={14} /> Dwg 1414-BST1-11001</div>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <button onClick={() => setPlaying((p) => !p)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#0B1B33] text-white">
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? "Pause" : "Play sequence"}
        </button>
        <button onClick={() => setDayOffset((d) => d - 1)} className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft size={14} /></button>
        <div className="flex gap-1">
          {DAY_OFFSETS.map((o) => (
            <button key={o} onClick={() => { setPlaying(false); setDayOffset(o); }}
              className={`px-3 py-1.5 rounded-md text-xs border ${o === dayOffset ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {o === TODAY_OFFSET ? "Today" : offsetToFullLabel(o).split(",")[0]}
            </button>
          ))}
        </div>
        <button onClick={() => setDayOffset((d) => d + 1)} className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight size={14} /></button>
        <span className="text-xs text-gray-400 ml-2">{offsetToFullLabel(dayOffset)}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 flex flex-col overflow-auto">
          <div className="relative inline-block mx-auto">
            <img src={sitePlan} alt="OMSF Maintenance Building floor plan" className="max-w-full h-auto select-none" draggable={false} />
            <svg viewBox="0 0 1000 1520" className="absolute inset-0 w-full h-full">
              {ZONES.map((zone) => {
                const data = zoneData[zone.id];
                const style = STATUS[data.key];
                const isHovered = hoveredZone === zone.id;
                return (
                  <polygon
                    key={zone.id}
                    points={zone.points}
                    fill={style.fill || "rgba(255,255,255,0.15)"}
                    fillOpacity={data.key === "not_planned" ? 0.05 : 0.35}
                    stroke={isHovered ? "#1f2937" : (style.stroke || "#9ca3af")}
                    strokeWidth={isHovered ? 3 : 2}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                  />
                );
              })}
            </svg>
          </div>

          <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-gray-100 mt-3">
            {["planned", "in_progress", "completed", "delayed", "not_planned"].map((key) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: STATUS[key].fill || "#fff", borderColor: STATUS[key].stroke || "#e5e7eb" }} />
                {STATUS[key].label}
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-medium text-gray-900">{offsetToFullLabel(dayOffset)}</div>
            <div className="text-xs text-gray-400">Activities by area</div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {ZONES.map((zone) => {
              const data = zoneData[zone.id];
              if (data.tasks.length === 0) return null;
              const style = STATUS[data.key];
              return (
                <div key={zone.id} onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-700">{zone.id}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${style.chip}`}>{style.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.tasks.map((t) => {
                      const flag = getFlagState(t, dayOffset);
                      return (
                        <div key={t.id} className="text-xs">
                          <div className="flex items-center gap-1.5 text-gray-900">
                            {flag !== "none" && <Flag size={11} fill={flag === "explained" ? "currentColor" : "none"} className={flag === "explained" ? "text-amber-500" : "text-red-500"} />}
                            {t.title}
                          </div>
                          <div className="text-gray-400">{t.group} · {t.subcontractor}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {ZONES.every((z) => zoneData[z.id].tasks.length === 0) && (
              <div className="px-4 py-8 text-center text-gray-400 text-xs">No activity in any area for this day.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
