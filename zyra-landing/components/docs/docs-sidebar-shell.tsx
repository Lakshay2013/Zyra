"use client";

import { usePathname } from "next/navigation";
import type { DocsNavSection } from "@/lib/docs-nav";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export function DocsSidebarShell({ nav }: { nav: DocsNavSection[] }) {
  const pathname = usePathname();
  return <DocsSidebar key={pathname} nav={nav} />;
}
