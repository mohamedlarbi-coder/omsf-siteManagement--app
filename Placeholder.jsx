import React from "react";

export default function Placeholder({ label }) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      <div className="text-center">
        <div className="mb-1">"{label}" module not built yet</div>
        <div className="text-xs text-gray-300">Coming after the core modules are wired to Supabase</div>
      </div>
    </div>
  );
}
