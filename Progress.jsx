import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar } from "recharts";
import { StatCard } from "./status.jsx";

// =============================================================================
// MODULE 8 — Progress (visual, numbers-first read of the whole site)
// =============================================================================
const SCURVE_DATA = [
  { week: "Wk 1", planned: 8, actual: 7 },
  { week: "Wk 2", planned: 18, actual: 15 },
  { week: "Wk 3", planned: 30, actual: 24 },
  { week: "Wk 4", planned: 44, actual: 35 },
  { week: "Wk 5", planned: 58, actual: 46 },
  { week: "Wk 6", planned: 70, actual: 58 },
  { week: "Wk 7", planned: 82, actual: 68 },
  { week: "Wk 8 (today)", planned: 91, actual: 72 },
];

const ZONE_PROGRESS = [
  { zone: "Z02-01", pct: 92 },
  { zone: "Z02-02", pct: 35 },
  { zone: "Z02-03", pct: 48 },
  { zone: "Z02-04", pct: 60 },
];

const STATUS_BREAKDOWN = [
  { name: "Completed", value: 3, color: "#d97706" },
  { name: "In Progress", value: 2, color: "#10b981" },
  { name: "Planned", value: 2, color: "#3b82f6" },
  { name: "Delayed", value: 1, color: "#ef4444" },
  { name: "Blocked", value: 1, color: "#9ca3af" },
];

const SUB_PPC = [
  { sub: "Carpentry Sub", ppc: 88 },
  { sub: "Steel Fixer Sub", ppc: 74 },
  { sub: "Concrete Sub", ppc: 95 },
  { sub: "MEP Sub", ppc: 52 },
  { sub: "Masonry Sub", ppc: 80 },
  { sub: "Waterproofing Sub", ppc: 90 },
];

const OVERALL_PCT = 72;

function ProgressContent() {
  const radialData = [{ name: "Complete", value: OVERALL_PCT, fill: "#3b82f6" }];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div><div className="text-base font-medium text-gray-900">Progress</div><div className="text-xs text-gray-500">A quick visual read of where the site stands — Wed, 15 Jul 2026</div></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div style={{ width: 72, height: 72 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-xl font-medium text-gray-900">{OVERALL_PCT}%</div>
              <div className="text-xs text-gray-500">Percent Plan Complete</div>
            </div>
          </div>
          <StatCard label="Planned vs Actual gap" value="-19 pts" tone="danger" />
          <StatCard label="Zones over 80% complete" value="1 / 4" tone="warning" />
          <StatCard label="Subs below 70% PPC" value="1" tone="warning" />
        </div>

        {/* S-curve */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-900 mb-1">Planned vs Actual — Cumulative Progress</div>
          <div className="text-xs text-gray-400 mb-2">The gap between the two lines is exactly how far behind (or ahead) the job is, at a glance.</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SCURVE_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Line type="monotone" dataKey="planned" stroke="#93c5fd" strokeWidth={2} dot={false} name="Planned" />
                <Line type="monotone" dataKey="actual" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Progress by zone */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">Progress by Area / Zone</div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ZONE_PROGRESS} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="zone" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="pct" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">Activities by Status</div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={STATUS_BREAKDOWN} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {STATUS_BREAKDOWN.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Subcontractor PPC */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-900 mb-1">Subcontractor Percent Plan Complete</div>
          <div className="text-xs text-gray-400 mb-2">Completed-as-committed ÷ total planned activities, per subcontractor.</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SUB_PPC} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="sub" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Bar dataKey="ppc" radius={[4, 4, 0, 0]} barSize={28}>
                  {SUB_PPC.map((row, i) => <Cell key={i} fill={row.ppc < 70 ? "#ef4444" : row.ppc < 85 ? "#d97706" : "#10b981"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}


export default ProgressContent;
