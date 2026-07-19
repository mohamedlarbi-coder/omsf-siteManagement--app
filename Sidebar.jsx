import React from "react";
import {
  LayoutDashboard, CalendarClock, LayoutGrid, FileText, ClipboardList,
  ListChecks, AlertTriangle, ClipboardCheck, Users, MessageSquare,
  TrendingUp, FolderOpen, UserCircle, Settings,
} from "lucide-react";
import logoIcon from "./logo-icon.png";

// One source of truth for navigation — each item maps to a view key used
// by App.jsx to decide which module component to render.
export const NAV = [
  { key: "dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { key: "lookahead",   icon: CalendarClock,   label: "Look Ahead" },
  { key: "visual",      icon: LayoutGrid,      label: "Visual Schedule" },
  { key: "documents",   icon: FileText,        label: "Drawings" },
  { key: "daily",       icon: ClipboardList,   label: "Daily Reports" },
  { key: "dashboard",   icon: ListChecks,      label: "Activities" },
  { key: "constraints", icon: AlertTriangle,   label: "Constraints" },
  { key: "inspections", icon: ClipboardCheck,  label: "Inspections" },
  { key: "subs",        icon: Users,           label: "Subcontractors" },
  { key: "comms",       icon: MessageSquare,   label: "Communications" },
  { key: "progress",    icon: TrendingUp,      label: "Progress" },
  { key: "documents",   icon: FolderOpen,      label: "Documents" },
  { key: "team",        icon: UserCircle,      label: "Team" },
  { key: "settings",    icon: Settings,        label: "Settings" },
];

export default function Sidebar({ view, setView }) {
  return (
    <div className="w-52 bg-[#0B1B33] text-gray-300 flex flex-col shrink-0">
      <div className="px-4 py-4 flex items-center gap-2.5 border-b border-white/10">
        <img src={logoIcon} alt="OMSF Field" className="w-8 h-8 rounded-md object-cover" />
        <span className="text-white font-medium text-base leading-tight">OMSF Field</span>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = item.key === view;
          return (
            <div
              key={item.label}
              onClick={() => setView(item.key)}
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer ${
                isActive ? "bg-white/10 text-white border-l-2 border-blue-400" : "hover:bg-white/5"
              }`}
            >
              <item.icon size={16} />
              <span className="text-[13px]">{item.label}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
