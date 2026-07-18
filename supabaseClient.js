// Not wired into any module yet — every module currently uses mock data
// (DASH_ACTIVITIES, REAL_SCHEDULE, etc.) defined at the top of its file.
// Once schema.sql (from the data-model conversation) is applied to a
// Supabase project, replace those mock arrays with calls like:
//
//   const { data, error } = await supabase.from("activities").select("*");
//
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn(
    "Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable it."
  );
}
