# OMSF Field

Construction look-ahead and daily progress app for the OMSF project (Ontario
Line, Connect6ix / Metrolinx). Built with React + Vite + Tailwind, matching the
MINERVIUM stack (Supabase + Vercel) so the two apps can eventually share a
backend and auth if you want.

## What's here

Eight working modules, navigable from one sidebar:

| Module | File | Status |
|---|---|---|
| Dashboard + Activities | `src/modules/Dashboard.jsx` | Mock data |
| Visual Schedule (drawing + zones) | `src/modules/VisualSchedule.jsx` | Mock data |
| Daily Report | `src/modules/DailyReport.jsx` | Mock data |
| Look-Ahead | `src/modules/LookAhead.jsx` | **Real data** — imported from your `OMSF_3_month_look_ahead_Schedule_Linked.xlsx` (110 tasks, Areas 1/2/3/5, Jul 6–Sep 11 2026) |
| Documents | `src/modules/Documents.jsx` | Mock data |
| Inspections | `src/modules/Inspections.jsx` | Mock data |
| Constraints (+ Change Orders, RFIs, Contractual Issues) | `src/modules/Constraints.jsx` | Mock data |
| Progress (charts) | `src/modules/Progress.jsx` | Mock data |

Not yet built: Drawings (CAD/PDF viewer specifically), Subcontractors,
Communications, Team, Settings — the sidebar shows a placeholder for these.

## Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Project structure

```
src/
  App.jsx                 — shell: sidebar + view switcher
  components/
    Sidebar.jsx            — nav definition (single source of truth for routes)
    Placeholder.jsx
  lib/
    status.jsx              — shared status colors/labels used by every module
    supabaseClient.js        — Supabase client (not wired in yet, see below)
  modules/
    Dashboard.jsx, VisualSchedule.jsx, DailyReport.jsx, LookAhead.jsx,
    Documents.jsx, Inspections.jsx, Constraints.jsx, Progress.jsx
  data/
    schedule.js              — the real OMSF look-ahead data used by LookAhead.jsx
```

Each module is self-contained with its own mock data at the top of the file
(easy to find and replace — search for the `const ALL_CAPS_NAME = [...]`
array at the top of each module).

## Connecting Supabase (next step)

1. Create a Supabase project and run the `schema.sql` from the data-model
   conversation (the `activities`, `zones`, `daily_reports`, etc. tables).
2. Copy `.env.example` to `.env` and fill in your project URL + anon key.
3. In each module, replace the mock array with a Supabase query, e.g. in
   `Dashboard.jsx`:

   ```jsx
   import { supabase } from "../lib/supabaseClient.js";
   import { useEffect, useState } from "react";

   const [activities, setActivities] = useState([]);
   useEffect(() => {
     supabase.from("activities").select("*").then(({ data }) => setActivities(data ?? []));
   }, []);
   ```

   Do this module by module rather than all at once — Dashboard and
   LookAhead are the best places to start since they map directly to the
   `activities` table.

## Deploying

The quickest path, matching your MINERVIUM setup:

```bash
npm run build
```

Then either:
- Push this folder to a GitHub repo and import it in Vercel (auto-detects
  Vite), or
- Run `npx vercel` from this folder if you have the Vercel CLI.

Set the same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as environment
variables in the Vercel project settings once Supabase is wired in.
