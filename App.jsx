import React, { useState } from "react";
import Sidebar, { NAV } from "./Sidebar.jsx";
import Placeholder from "./Placeholder.jsx";

import Dashboard from "./Dashboard.jsx";
import VisualSchedule from "./VisualSchedule.jsx";
import DailyReport from "./DailyReport.jsx";
import LookAhead from "./LookAhead.jsx";
import Documents from "./Documents.jsx";
import Inspections from "./Inspections.jsx";
import Constraints from "./Constraints.jsx";
import Progress from "./Progress.jsx";

const VIEWS = {
  dashboard: Dashboard,
  visual: VisualSchedule,
  daily: DailyReport,
  lookahead: LookAhead,
  documents: Documents,
  inspections: Inspections,
  constraints: Constraints,
  progress: Progress,
};

export default function App() {
  const [view, setView] = useState("dashboard");
  const ActiveModule = VIEWS[view];

  return (
    <div className="flex h-screen bg-gray-50 text-sm overflow-hidden">
      <Sidebar view={view} setView={setView} />
      <div className="flex-1 flex flex-col min-w-0">
        {ActiveModule ? <ActiveModule /> : <Placeholder label={NAV.find((n) => n.key === view)?.label || view} />}
      </div>
    </div>
  );
}
