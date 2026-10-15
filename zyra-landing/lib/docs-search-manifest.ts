/** Public doc titles + excerpts for client-side Flexsearch (no secrets). */
export type DocsSearchRecord = {
  title: string;
  href: string;
  snippet: string;
};

export const DOCS_SEARCH_MANIFEST: DocsSearchRecord[] = [
  {
    title: "Documentation overview",
    href: "/docs",
    snippet:
      "Documentation hub routing quick start guides concepts API SDK dashboard links.",
  },
  {
    title: "Quick start",
    href: "/docs/quickstart",
    snippet:
      "Install zyra-sdk npm authentication API key dashboard first chat completions model auto under five minutes.",
  },
  {
    title: "Cost optimization",
    href: "/docs/concepts/cost-optimization",
    snippet:
      "Cost engine task complexity cheapest capable model routing spend savings downgrade.",
  },
  {
    title: "Quality Guard",
    href: "/docs/concepts/quality-guard",
    snippet:
      "Quality guard downgrade premium models reasoning output equivalence safe routing.",
  },
  {
    title: "POST /v1/chat/completions",
    href: "/docs/api/chat-completions",
    snippet:
      "OpenAI-compatible chat completions endpoint streaming parameters headers x-zyra-api-key.",
  },
  {
    title: "Architecture overview",
    href: "/architecture",
    snippet:
      "Proxy architecture how Zyra intercepts optimizes routes API calls providers.",
  },
];
