"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu, PanelLeftClose } from "lucide-react";
import { useState } from "react";
import type { DocsNavSection } from "@/lib/docs-nav";

export function DocsSidebar({ nav }: { nav: DocsNavSection[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const panel = (
    <nav aria-label="Documentation" className="space-y-6">
      {nav.map((section, idx) => {
        const folded = collapsed[idx];
        return (
          <div key={section.title}>
            <button
              type="button"
              onClick={() => setCollapsed((s) => ({ ...s, [idx]: !s[idx] }))}
              className="flex w-full items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 mb-2 hover:text-gray-400"
              aria-expanded={!folded}
            >
              {folded ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              {section.title}
            </button>
            {!folded && (
              <ul className="space-y-0.5 border-l border-white/[0.06] ml-2 pl-3">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                          active
                            ? "text-brand-accent bg-brand-accent/10 font-medium"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed bottom-6 left-6 z-[90] flex items-center gap-2 rounded-xl border border-white/[0.08] bg-brand-surface px-4 py-3 text-[13px] text-gray-200 shadow-lg"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="docs-sidebar"
      >
        {mobileOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
        Docs menu
      </button>

      <div
        id="docs-sidebar"
        className={`
          shrink-0 w-56 lg:w-64
          lg:relative lg:z-auto lg:translate-x-0 lg:visible lg:pointer-events-auto
          max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:z-[80]
          max-lg:h-full max-lg:w-[min(100vw,17rem)] max-lg:overflow-y-auto
          max-lg:border-r max-lg:border-white/[0.06] max-lg:bg-brand-bg max-lg:pt-24 max-lg:px-5 max-lg:pb-8
          max-lg:transition-transform max-lg:duration-200 max-lg:ease-out
          ${
            mobileOpen
              ? "max-lg:translate-x-0 max-lg:visible max-lg:pointer-events-auto"
              : "max-lg:-translate-x-full max-lg:pointer-events-none max-lg:invisible"
          }
        `}
      >
        <div className="lg:sticky lg:top-28">{panel}</div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-[75] bg-black/50 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
