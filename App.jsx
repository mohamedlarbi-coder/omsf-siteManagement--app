import React, { useState, useEffect } from "react";
import Sidebar, { NAV } from "./Sidebar.jsx";
import Placeholder from "./Placeholder.jsx";
import Login from "./Login.jsx";
import { supabase } from "./supabaseClient.js";
import { setCurrentUser } from "./dailyLogStore.js";

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
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out
  const ActiveModule = VIEWS[view];

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) setCurrentUser(user.user_metadata?.full_name || user.email);
  }, [user]);

  if (user === undefined) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-400">Loading…</div>;
  }

  if (!user) {
    return <Login onSignedIn={setUser} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-sm overflow-hidden">
      <Sidebar view={view} setView={setView} user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        {ActiveModule ? <ActiveModule /> : <Placeholder label={NAV.find((n) => n.key === view)?.label || view} />}
      </div>
    </div>
  );
}
