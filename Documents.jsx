import React, { useState, useMemo } from "react";
import { FileText, ClipboardCheck, FolderOpen, Search, Layers, Download, Building2, Wrench, Zap, HardHat, Megaphone } from "lucide-react";

// =============================================================================
// MODULE 5 — Documents (drawings organized by discipline)
// =============================================================================
const DOC_CATEGORIES = [
  { key: "all", label: "All Documents", icon: FolderOpen },
  { key: "structural", label: "Structural", icon: Layers },
  { key: "architectural", label: "Architectural", icon: Building2 },
  { key: "mechanical", label: "Mechanical", icon: Wrench },
  { key: "electrical", label: "Electrical", icon: Zap },
  { key: "civil", label: "Civil", icon: HardHat },
  { key: "field_directive", label: "Field Directives", icon: Megaphone },
  { key: "shop_drawing", label: "Shop Drawings", icon: FileText },
  { key: "method_statement", label: "Method Statements", icon: ClipboardCheck },
];

const DOCUMENTS = [
  { id: "D-001", title: "Level 02 Floor Plan", category: "architectural", number: "A-120", revision: "Rev 03", date: "2026-06-28", uploadedBy: "J. Smith" },
  { id: "D-002", title: "Foundation Plan — Area 3", category: "structural", number: "S-210", revision: "Rev 05", date: "2026-07-02", uploadedBy: "Mohamed" },
  { id: "D-003", title: "Rebar Detail — Sump Pit C7", category: "structural", number: "S-341", revision: "Rev 02", date: "2026-07-10", uploadedBy: "Mohamed" },
  { id: "D-004", title: "MEP Rough-In Layout — Level 02", category: "mechanical", number: "M-114", revision: "Rev 01", date: "2026-06-15", uploadedBy: "MEP Sub" },
  { id: "D-005", title: "Panel Schedule — Building A", category: "electrical", number: "E-205", revision: "Rev 02", date: "2026-06-20", uploadedBy: "Electrical Sub" },
  { id: "D-006", title: "Site Drainage Layout", category: "civil", number: "C-101", revision: "Rev 04", date: "2026-05-30", uploadedBy: "Mohamed" },
  { id: "D-007", title: "FD-014 — Revised Waterproofing Detail", category: "field_directive", number: "FD-014", revision: "Issued", date: "2026-07-08", uploadedBy: "Consultant" },
  { id: "D-008", title: "Shop Drawing — Precast Sump Pit", category: "shop_drawing", number: "SD-077", revision: "Approved", date: "2026-06-25", uploadedBy: "Precast Sub" },
  { id: "D-009", title: "Confined Space Entry Method Statement", category: "method_statement", number: "MS-009", revision: "Rev 02", date: "2026-06-10", uploadedBy: "Mohamed" },
];

function DocumentsContent() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => DOCUMENTS.filter((d) => {
    const matchesCat = category === "all" || d.category === category;
    const matchesQuery = d.title.toLowerCase().includes(query.toLowerCase()) || d.number.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  }), [category, query]);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div><div className="text-base font-medium text-gray-900">Documents</div><div className="text-xs text-gray-500">Drawings and project documents by discipline</div></div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or number"
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md w-56 outline-none focus:border-blue-400" />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-gray-200 bg-white overflow-y-auto shrink-0 py-2">
          {DOC_CATEGORIES.map((c) => {
            const count = c.key === "all" ? DOCUMENTS.length : DOCUMENTS.filter((d) => d.category === c.key).length;
            return (
              <div key={c.key} onClick={() => setCategory(c.key)}
                className={`flex items-center justify-between gap-2 px-4 py-2 cursor-pointer text-xs ${category === c.key ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
                <span className="flex items-center gap-2"><c.icon size={14} />{c.label}</span>
                <span className="text-gray-400">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-normal">Title</th><th className="px-4 py-2 font-normal">Number</th>
              <th className="px-4 py-2 font-normal">Category</th><th className="px-4 py-2 font-normal">Revision</th>
              <th className="px-4 py-2 font-normal">Date</th><th className="px-4 py-2 font-normal">Uploaded by</th><th className="px-4 py-2 font-normal"></th>
            </tr></thead>
            <tbody>
              {filtered.map((d) => {
                const cat = DOC_CATEGORIES.find((c) => c.key === d.category);
                return (
                  <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-900">{d.title}</td>
                    <td className="px-4 py-2.5 text-gray-500">{d.number}</td>
                    <td className="px-4 py-2.5"><span className="flex items-center gap-1.5 text-xs text-gray-600"><cat.icon size={13} />{cat.label}</span></td>
                    <td className="px-4 py-2.5 text-gray-600">{d.revision}</td>
                    <td className="px-4 py-2.5 text-gray-600">{d.date}</td>
                    <td className="px-4 py-2.5 text-gray-600">{d.uploadedBy}</td>
                    <td className="px-4 py-2.5 text-gray-300"><Download size={15} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-xs">No documents in this category.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}


export default DocumentsContent;
