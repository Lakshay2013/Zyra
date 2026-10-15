"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Heading = { id: string; text: string; depth: number };

export function DocsToc() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const root = document.getElementById("article-content");
    if (!root) return;

    const collect = () => {
      const nodes = root.querySelectorAll("h2[id], h3[id]");
      const list: Heading[] = [];
      nodes.forEach((el) => {
        const id = el.getAttribute("id");
        if (!id) return;
        const depth = el.tagName === "H2" ? 2 : 3;
        list.push({ id, text: el.textContent?.replace(/#$/, "").trim() ?? id, depth });
      });
      setHeadings(list);
      setActive("");
    };

    collect();
    const mo = new MutationObserver(collect);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (headings.length === 0) return;
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden xl:block w-48 shrink-0" aria-label="On this page">
      <div className="sticky top-28 space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
          On this page
        </div>
        <ul className="space-y-1 border-l border-white/[0.06] text-[12px]">
          {headings.map((h) => (
            <li key={h.id} className={h.depth === 3 ? "ml-3" : ""}>
              <a
                href={`#${h.id}`}
                className={`block py-1 pl-3 -ml-px border-l-2 border-transparent hover:text-white transition-colors ${
                  active === h.id
                    ? "text-brand-accent border-brand-accent"
                    : "text-gray-500 hover:border-white/20"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
