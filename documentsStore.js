import { useSyncExternalStore } from "react";

// =============================================================================
// Generated documents — PDFs created from inside the app (right now: Daily
// Report exports) get registered here so they show up in the Documents
// module without needing a real backend yet. The file itself lives as a
// Blob URL in browser memory for the rest of the session; once Supabase
// Storage is wired in, addGeneratedDoc is the natural place to upload the
// blob and store a real URL instead.
// =============================================================================

let generatedDocs = []; // { id, title, category, date, url, uploadedBy }
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  return generatedDocs;
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useGeneratedDocs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addGeneratedDoc({ title, category = "daily_report", date, url, uploadedBy = "Mohamed" }) {
  const id = `gen-${Date.now()}`;
  generatedDocs = [{ id, title, category, date, url, uploadedBy }, ...generatedDocs];
  emit();
  return id;
}

export function getGeneratedDocs() {
  return generatedDocs;
}
