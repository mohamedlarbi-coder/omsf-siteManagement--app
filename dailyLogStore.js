import { useSyncExternalStore } from "react";
import { TODAY_OFFSET } from "./schedule.js";

// =============================================================================
// Planned-vs-actual variance tracker (spec Section 8: "Daily Report
// Intelligence"). This is a tiny in-memory shared store — no backend wired
// in yet — so LookAhead.jsx and DailyReport.jsx both read/write the same
// data and stay in sync within a session. Once Supabase is connected, these
// functions are the natural place to swap in real reads/writes to the
// `daily_report_activities` table from schema.sql.
// =============================================================================

let logs = {}; // { [taskId]: { status, actualNotes, flagNote, flagNoteAt } }
const listeners = new Set();

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

export function setTaskStatus(taskId, status) {
  logs = { ...logs, [taskId]: { ...(logs[taskId] || {}), status } };
  emit();
}

export function setTaskField(taskId, field, value) {
  logs = { ...logs, [taskId]: { ...(logs[taskId] || {}), [field]: value } };
  emit();
}

export function addFlagNote(taskId, text) {
  logs = { ...logs, [taskId]: { ...(logs[taskId] || {}), flagNote: text, flagNoteAt: new Date().toISOString() } };
  emit();
}

// A task is "logged" once the Daily Report has any status recorded for it —
// this is what clears the automatic "unreported" flag.
export function isLogged(taskId) {
  return !!(logs[taskId] && logs[taskId].status);
}

// A task is "active today" if today falls anywhere inside its planned
// [start, end) span — this is what makes it show up on today's Daily Report
// in the first place.
export function isTaskActiveToday(task) {
  return task.offset <= TODAY_OFFSET && task.offset + task.span > TODAY_OFFSET;
}

// Statuses that represent a deviation from plan — these are the ones worth
// flagging even once they're recorded, so the variance stays visible for
// tracking rather than disappearing the moment *something* gets typed in.
const VARIANCE_STATUSES = ["delayed", "cancelled", "not_started", "partially_completed"];

// The core rule the person asked for, in three levels:
//   "unreported"  — scheduled today, nothing recorded at all (needs attention now)
//   "unexplained" — a status like Delayed/Cancelled was recorded, but no note
//                   says why (still needs attention)
//   "explained"   — a variance status was recorded AND a note (in the Daily
//                   Report itself, or added via the flag) explains why — still
//                   shown so the variance stays visible in the tracker, but
//                   calm rather than urgent since nothing further is needed
//   "none"        — not scheduled today, or recorded as on-plan (completed/
//                   in_progress) with no issue
export function getFlagState(task) {
  if (!isTaskActiveToday(task)) return "none";
  const entry = logs[task.id] || {};
  if (!entry.status) return "unreported";
  if (!VARIANCE_STATUSES.includes(entry.status)) return "none";
  const hasNote = !!((entry.reportNote && entry.reportNote.trim()) || (entry.flagNote && entry.flagNote.trim()));
  return hasNote ? "explained" : "unexplained";
}

// Kept for simple call sites that only need a yes/no — true for any of the
// three non-"none" states above.
export function isFlagged(task) {
  return getFlagState(task) !== "none";
}

// Only the two urgent states — used where we want a count of things that
// genuinely still need action, separate from variances that are already
// explained and just being tracked.
export function needsAttention(task) {
  const s = getFlagState(task);
  return s === "unreported" || s === "unexplained";
}

export function getEntry(taskId) {
  return logs[taskId] || {};
}
