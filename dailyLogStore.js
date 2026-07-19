import { useSyncExternalStore } from "react";
import { TODAY_OFFSET } from "./schedule.js";
import { supabase } from "./supabaseClient.js";

// =============================================================================
// Planned-vs-actual variance tracker (spec Section 8: "Daily Report
// Intelligence") — now backed by Supabase (tables: daily_activity_logs,
// custom_activities) so entries are shared across every signed-in user,
// not just the local browser session. A local cache still mirrors the data
// for instant UI updates; Supabase Realtime keeps that cache in sync with
// what other users are writing.
// =============================================================================

let logs = {}; // { [`${taskId}__${offset}`]: { status, reportNote, flagNote, flagNoteAt, updatedBy } }
let customActivities = []; // [{ id, title, area, group, subcontractor, offset, span, createdBy }]
let currentUserName = "Someone";
let initialized = false;

const listeners = new Set();

function key(taskId, offset) {
  return `${taskId}__${offset}`;
}

function emit() {
  listeners.forEach((l) => l());
}

function getLogsSnapshot() {
  return logs;
}

function subscribe(callback) {
  listeners.add(callback);
  ensureInit();
  return () => listeners.delete(callback);
}

export function useDailyLogs() {
  return useSyncExternalStore(subscribe, getLogsSnapshot, getLogsSnapshot);
}

// Called once from App.jsx after sign-in, so writes can be attributed to
// whoever is actually logged in.
export function setCurrentUser(name) {
  currentUserName = name || "Someone";
}

// -----------------------------------------------------------------------
// Supabase sync: fetch once, then keep in sync via realtime subscriptions.
// -----------------------------------------------------------------------
function ensureInit() {
  if (initialized || !supabase) return;
  initialized = true;

  supabase.from("daily_activity_logs").select("*").then(({ data, error }) => {
    if (error) { console.error("daily_activity_logs fetch failed:", error.message); return; }
    const next = {};
    (data || []).forEach((row) => {
      next[key(row.task_id, row.day_offset)] = {
        status: row.status, reportNote: row.report_note, flagNote: row.flag_note,
        flagNoteAt: row.flag_note_at, updatedBy: row.updated_by,
      };
    });
    logs = next;
    emit();
  });

  supabase.from("custom_activities").select("*").then(({ data, error }) => {
    if (error) { console.error("custom_activities fetch failed:", error.message); return; }
    customActivities = (data || []).map((row) => ({
      id: row.id, title: row.title, area: row.area, group: row.group_name,
      subcontractor: row.subcontractor, offset: row.day_offset, span: 1, createdBy: row.created_by,
    }));
    emit();
  });

  supabase
    .channel("daily-activity-logs-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "daily_activity_logs" }, (payload) => {
      const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
      if (!row) return;
      const k = key(row.task_id, row.day_offset);
      if (payload.eventType === "DELETE") {
        const next = { ...logs };
        delete next[k];
        logs = next;
      } else {
        logs = { ...logs, [k]: {
          status: row.status, reportNote: row.report_note, flagNote: row.flag_note,
          flagNoteAt: row.flag_note_at, updatedBy: row.updated_by,
        } };
      }
      emit();
    })
    .subscribe();

  supabase
    .channel("custom-activities-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "custom_activities" }, (payload) => {
      if (payload.eventType === "DELETE") {
        customActivities = customActivities.filter((c) => c.id !== payload.old.id);
      } else {
        const row = payload.new;
        const mapped = {
          id: row.id, title: row.title, area: row.area, group: row.group_name,
          subcontractor: row.subcontractor, offset: row.day_offset, span: 1, createdBy: row.created_by,
        };
        const exists = customActivities.some((c) => c.id === row.id);
        customActivities = exists
          ? customActivities.map((c) => (c.id === row.id ? mapped : c))
          : [...customActivities, mapped];
      }
      emit();
    })
    .subscribe();
}

// -----------------------------------------------------------------------
// Writes — update the local cache immediately (so the UI feels instant),
// then push to Supabase in the background. Other signed-in users get the
// update via the realtime subscription above.
// -----------------------------------------------------------------------
async function upsertLog(taskId, offset, patch) {
  const k = key(taskId, offset);
  logs = { ...logs, [k]: { ...(logs[k] || {}), ...patch } };
  emit();
  if (!supabase) return;
  const row = logs[k];
  const { error } = await supabase.from("daily_activity_logs").upsert({
    task_id: taskId,
    day_offset: offset,
    status: row.status ?? null,
    report_note: row.reportNote ?? null,
    flag_note: row.flagNote ?? null,
    flag_note_at: row.flagNoteAt ?? null,
    updated_by: currentUserName,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("Failed to save daily log entry:", error.message);
}

export function setTaskStatus(taskId, status, offset = TODAY_OFFSET) {
  upsertLog(taskId, offset, { status, updatedBy: currentUserName });
}

export function setTaskField(taskId, field, value, offset = TODAY_OFFSET) {
  upsertLog(taskId, offset, { [field]: value, updatedBy: currentUserName });
}

export function addFlagNote(taskId, text, offset = TODAY_OFFSET) {
  upsertLog(taskId, offset, { flagNote: text, flagNoteAt: new Date().toISOString(), updatedBy: currentUserName });
}

export function getEntry(taskId, offset = TODAY_OFFSET) {
  return logs[key(taskId, offset)] || {};
}

export function isLogged(taskId, offset = TODAY_OFFSET) {
  const entry = logs[key(taskId, offset)];
  return !!(entry && entry.status);
}

export function isTaskActiveOnOffset(task, offset = TODAY_OFFSET) {
  return task.offset <= offset && task.offset + task.span > offset;
}

export function isTaskActiveToday(task) {
  return isTaskActiveOnOffset(task, TODAY_OFFSET);
}

const VARIANCE_STATUSES = ["delayed", "cancelled", "not_started", "partially_completed"];

export function getFlagState(task, offset = TODAY_OFFSET) {
  if (!isTaskActiveOnOffset(task, offset)) return "none";
  const entry = logs[key(task.id, offset)] || {};
  if (!entry.status) return "unreported";
  if (!VARIANCE_STATUSES.includes(entry.status)) return "none";
  const hasNote = !!((entry.reportNote && entry.reportNote.trim()) || (entry.flagNote && entry.flagNote.trim()));
  return hasNote ? "explained" : "unexplained";
}

export function isFlagged(task, offset = TODAY_OFFSET) {
  return getFlagState(task, offset) !== "none";
}

export function needsAttention(task, offset = TODAY_OFFSET) {
  const s = getFlagState(task, offset);
  return s === "unreported" || s === "unexplained";
}

// -----------------------------------------------------------------------
// Ad-hoc activities (maintenance, walk-throughs, etc. not on the schedule)
// -----------------------------------------------------------------------
export async function addCustomActivity(offset, title, subcontractor = "—") {
  const id = `custom-${offset}-${Date.now()}-${Math.round(Math.random() * 999)}`;
  const activity = { id, title, area: "Unplanned", group: "Ad-hoc / Maintenance", subcontractor, offset, span: 1, createdBy: currentUserName };
  customActivities = [...customActivities, activity];
  emit();
  if (!supabase) return id;
  const { error } = await supabase.from("custom_activities").insert({
    id, day_offset: offset, title, area: "Unplanned", group_name: "Ad-hoc / Maintenance",
    subcontractor, created_by: currentUserName,
  });
  if (error) console.error("Failed to save ad-hoc activity:", error.message);
  return id;
}

export async function removeCustomActivity(id) {
  customActivities = customActivities.filter((c) => c.id !== id);
  emit();
  if (!supabase) return;
  const { error } = await supabase.from("custom_activities").delete().eq("id", id);
  if (error) console.error("Failed to delete ad-hoc activity:", error.message);
}

export function getCustomActivities(offset = TODAY_OFFSET) {
  return customActivities.filter((c) => c.offset === offset);
}

export function getAllCustomActivities() {
  return customActivities;
}
