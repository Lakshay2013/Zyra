export type DocsNavItem = { title: string; href: string };
export type DocsNavSection = { title: string; items: DocsNavItem[] };

export const DOCS_NAV: DocsNavSection[] = [
  {
    title: "Getting started",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Quick start", href: "/docs/quickstart" },
    ],
  },
  {
    title: "Concepts",
    items: [
      { title: "Cost optimization", href: "/docs/concepts/cost-optimization" },
      { title: "Quality Guard", href: "/docs/concepts/quality-guard" },
    ],
  },
  {
    title: "API reference",
    items: [
      { title: "Chat completions", href: "/docs/api/chat-completions" },
    ],
  },
  {
    title: "More",
    items: [
      { title: "Architecture overview", href: "/architecture" },
    ],
  },
];
