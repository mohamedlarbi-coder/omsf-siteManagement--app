import { useSyncExternalStore } from "react";
import { TODAY_OFFSET } from "./schedule.js";

// =============================================================================
// Planned-vs-actual variance tracker (spec Section 8: "Daily Report
// Intelligence"). This is a tiny in-memory shared store — no backend wired
// in yet — so LookAhead.jsx and DailyReport.jsx both read/write the same
// data and stay in sync within a session. Once Supabase is connected, these
// functions are the natural place to swap in real reads/writes to the
// `daily_report_activities` table from schema.sql (that table is already
// designed as one row per activity per date, which is exactly this shape).
//
// Entries are keyed by (task, day) — not just task — so browsing to a
// different date in the Daily Report doesn't overwrite or hide what was
// recorded for "today". Every function defaults its `offset` argument to
// TODAY_OFFSET, so existing call sites that only ever care about "today"
// (like the Look-Ahead flag badges) don't need to change.
// =============================================================================

let logs = {}; // { [`${taskId}__${offset}`]: { status, reportNote, flagNote, flagNoteAt } }
const listeners = new Set();

function key(taskId, offset) {
  return `${taskId}__${offset}`;
}

function emit() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  return logs;
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useDailyLogs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setTaskStatus(taskId, status, offset = TODAY_OFFSET) {
  const k = key(taskId, offset);
  logs = { ...logs, [k]: { ...(logs[k] || {}), status } };
  emit();
}

export function setTaskField(taskId, field, value, offset = TODAY_OFFSET) {
  const k = key(taskId, offset);
  logs = { ...logs, [k]: { ...(logs[k] || {}), [field]: value } };
  emit();
}

export function addFlagNote(taskId, text, offset = TODAY_OFFSET) {
  const k = key(taskId, offset);
  logs = { ...logs, [k]: { ...(logs[k] || {}), flagNote: text, flagNoteAt: new Date().toISOString() } };
  emit();
}

export function getEntry(taskId, offset = TODAY_OFFSET) {
  return logs[key(taskId, offset)] || {};
}

// A task is "logged" for a given day once the Daily Report has any status
// recorded for it on that day — this is what clears the automatic
// "unreported" flag for that specific date.
export function isLogged(taskId, offset = TODAY_OFFSET) {
  const entry = logs[key(taskId, offset)];
  return !!(entry && entry.status);
}

// A task is "active" on a given day if that day falls anywhere inside its
// planned [start, end) span — this is what makes it show up on that day's
// Daily Report in the first place.
export function isTaskActiveOnOffset(task, offset = TODAY_OFFSET) {
  return task.offset <= offset && task.offset + task.span > offset;
}

// Kept as a convenience alias for the common "is this happening today"
// check, since that's still what the Look-Ahead flag badges care about.
export function isTaskActiveToday(task) {
  return isTaskActiveOnOffset(task, TODAY_OFFSET);
}

// Statuses that represent a deviation from plan — these are the ones worth
// flagging even once they're recorded, so the variance stays visible for
// tracking rather than disappearing the moment *something* gets typed in.
const VARIANCE_STATUSES = ["delayed", "cancelled", "not_started", "partially_completed"];

// The core rule the person asked for, in three levels, evaluated for a
// specific day (defaulting to today):
//   "unreported"  — scheduled that day, nothing recorded at all (needs attention now)
//   "unexplained" — a status like Delayed/Cancelled was recorded, but no note
//                   says why (still needs attention)
//   "explained"   — a variance status was recorded AND a note (in the Daily
//                   Report itself, or added via the flag) explains why — still
//                   shown so the variance stays visible in the tracker, but
//                   calm rather than urgent since nothing further is needed
//   "none"        — not scheduled that day, or recorded as on-plan (completed/
//                   in_progress) with no issue
export function getFlagState(task, offset = TODAY_OFFSET) {
  if (!isTaskActiveOnOffset(task, offset)) return "none";
  const entry = logs[key(task.id, offset)] || {};
  if (!entry.status) return "unreported";
  if (!VARIANCE_STATUSES.includes(entry.status)) return "none";
  const hasNote = !!((entry.reportNote && entry.reportNote.trim()) || (entry.flagNote && entry.flagNote.trim()));
  return hasNote ? "explained" : "unexplained";
}

// Kept for simple call sites that only need a yes/no — true for any of the
// three non-"none" states above.
export function isFlagged(task, offset = TODAY_OFFSET) {
  return getFlagState(task, offset) !== "none";
}

// Only the two urgent states — used where we want a count of things that
// genuinely still need action, separate from variances that are already
// explained and just being tracked.
export function needsAttention(task, offset = TODAY_OFFSET) {
  const s = getFlagState(task, offset);
  return s === "unreported" || s === "unexplained";
}

// =============================================================================
// Ad-hoc activities — things that happen on site but were never on the
// schedule (maintenance, a client walk-through, an emergency repair, etc.).
// Shaped exactly like a REAL_SCHEDULE task (id/title/area/group/subcontractor/
// offset/span) so they flow through the same Yes/No + flagging logic above
// without any special-casing — a custom activity is just a task with no
// entry in schedule.js.
// =============================================================================
let customActivities = [];

export function addCustomActivity(offset, title, subcontractor = "—") {
  const id = `custom-${offset}-${Date.now()}-${Math.round(Math.random() * 999)}`;
  customActivities = [...customActivities, { id, title, area: "Unplanned", group: "Ad-hoc / Maintenance", subcontractor, offset, span: 1 }];
  emit();
  return id;
}

export function removeCustomActivity(id) {
  customActivities = customActivities.filter((c) => c.id !== id);
  emit();
}

export function getCustomActivities(offset = TODAY_OFFSET) {
  return customActivities.filter((c) => c.offset === offset);
}
