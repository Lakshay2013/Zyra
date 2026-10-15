"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Index } from "flexsearch";
import { DOCS_SEARCH_MANIFEST } from "@/lib/docs-search-manifest";
import { Search, X } from "lucide-react";

export function DocsSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => {
    const idx = new Index({ preset: "match", cache: true, tokenize: "forward" });
    DOCS_SEARCH_MANIFEST.forEach((row) => {
      idx.add(row.href, `${row.title} ${row.snippet}`);
    });
    return idx;
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQ("");
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits =
    q.trim().length < 2
      ? []
      : (() => {
          const results = index.search(q, { limit: 8 });
          const seen = new Set<string>();
          const rows: { href: string; title: string; snippet: string }[] = [];
          for (const id of results) {
            const href = String(id);
            if (seen.has(href)) continue;
            seen.add(href);
            const row = DOCS_SEARCH_MANIFEST.find((r) => r.href === href);
            if (row) rows.push(row);
          }
          return rows;
        })();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setQ("");
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-brand-surface px-3 py-2 text-left text-[12px] text-gray-500 hover:border-brand-accent/30 hover:text-gray-300 transition-colors min-w-[160px] md:min-w-[220px]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search size={14} className="shrink-0 opacity-70" />
        <span className="truncate">Search docs…</span>
        <kbd className="ml-auto hidden sm:inline font-mono text-[10px] text-gray-600 border border-white/[0.08] rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Search documentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-brand-bg shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3">
              <Search size={16} className="text-gray-500 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search titles and snippets…"
                className="flex-1 bg-transparent py-3 text-[14px] text-white placeholder:text-gray-600 outline-none"
                aria-autocomplete="list"
                aria-controls="docs-search-results"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>
            <ul id="docs-search-results" className="max-h-[50vh] overflow-y-auto py-2">
              {hits.length === 0 && q.trim().length >= 2 && (
                <li className="px-4 py-6 text-[13px] text-gray-500 text-center">No matches</li>
              )}
              {hits.length === 0 && q.trim().length < 2 && (
                <li className="px-4 py-6 text-[13px] text-gray-600 text-center">
                  Type at least 2 characters
                </li>
              )}
              {hits.map((h) => (
                <li key={h.href}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (h.href !== pathname) router.push(h.href);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/[0.04] focus:bg-white/[0.06] focus:outline-none"
                  >
                    <div className="text-[13px] font-semibold text-gray-200">{h.title}</div>
                    <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{h.snippet}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
