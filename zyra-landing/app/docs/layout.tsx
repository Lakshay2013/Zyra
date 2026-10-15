import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DOCS_NAV } from "@/lib/docs-nav";
import { DocsSidebarShell } from "@/components/docs/docs-sidebar-shell";
import { DocsSearch } from "@/components/docs/docs-search";
import { DocsToc } from "@/components/docs/docs-toc";

export const metadata: Metadata = {
  title: { default: "Documentation", template: "%s · Zyra Docs" },
  description:
    "Integrate, configure, and optimize with Zyra — SDK, API references, concepts, and quick start.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-bg text-white min-h-screen font-sans">
      <header className="fixed top-0 left-0 w-full z-[100] backdrop-blur-xl bg-brand-bg/80 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3 md:py-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/"
              className="font-black text-lg md:text-xl tracking-tight text-brand-accent hover:opacity-80 transition-opacity shrink-0"
            >
              ZYRA
            </Link>
            <span className="text-white/[0.08] hidden sm:inline">|</span>
            <Link
              href="/docs"
              className="text-[12px] md:text-[13px] text-gray-400 hover:text-white transition-colors truncate"
            >
              Documentation
            </Link>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <DocsSearch />
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 text-[12px] md:text-[13px] text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft size={14} /> Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex items-start gap-8 px-4 sm:px-6 pt-24 lg:pt-28 pb-20">
        <DocsSidebarShell nav={DOCS_NAV} />
        <article
          id="article-content"
          className="docs-mdx min-w-0 flex-1 max-w-3xl pt-2 md:pt-0 pb-12"
        >
          {children}
        </article>
        <DocsToc />
      </div>

      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 font-mono gap-4">
          <div>© 2026 ZYRA INC. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
