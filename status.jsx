// =============================================================================
// SHARED: status vocabulary used across every module — keeps colors and
// labels consistent whether it's a table chip, an SVG zone, or a Gantt bar.
// =============================================================================
export const STATUS = {
  planned:      { label: "Planned",      dot: "bg-blue-500",    chip: "bg-blue-50 text-blue-700 border-blue-200",       bar: "bg-blue-100 text-blue-800 border-blue-300",       fill: "#dbeafe", stroke: "#3b82f6" },
  in_progress:  { label: "In Progress",  dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-100 text-emerald-800 border-emerald-300", fill: "#d1fae5", stroke: "#10b981" },
  completed:    { label: "Completed",    dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 border-amber-200",    bar: "bg-amber-100 text-amber-800 border-amber-300",    fill: "#fef3c7", stroke: "#d97706" },
  partially_completed: { label: "Partially Completed", chip: "bg-blue-50 text-blue-700 border-blue-200" },
  delayed:      { label: "Delayed",      dot: "bg-red-500",     chip: "bg-red-50 text-red-700 border-red-200",          bar: "bg-red-100 text-red-800 border-red-300",          fill: "#fee2e2", stroke: "#ef4444" },
  blocked:      { label: "Blocked",      dot: "bg-gray-400",    chip: "bg-gray-100 text-gray-600 border-gray-200",      bar: "bg-gray-100 text-gray-500 border-gray-300",       fill: "#f3f4f6", stroke: "#9ca3af" },
  not_started:  { label: "Not Started",  chip: "bg-gray-100 text-gray-500 border-gray-200" },
  not_planned:  { label: "Not planned",  chip: "bg-white text-gray-400 border-gray-200",         fill: "#ffffff", stroke: "#e5e7eb" },
};

export function StatusChip({ status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${s.chip}`}>
      {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
      {s.label}
    </span>
  );
}

export function StatCard({ label, value, tone = "default" }) {
  const toneClass = { default: "text-gray-900", danger: "text-red-600", warning: "text-amber-600", success: "text-emerald-600" }[tone];
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-medium ${toneClass}`}>{value}</div>
    </div>
  );
}
