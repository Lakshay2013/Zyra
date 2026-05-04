import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
  description: "Zyra documentation hub — quick start, concepts, and API reference.",
};

const SPOTLIGHT = [
  {
    title: "Quick start",
    desc: "Install the SDK, set your API key, and send your first optimized request in minutes.",
    href: "/docs/quickstart",
  },
  {
    title: "Cost optimization",
    desc: "How the cost engine scores complexity and routes each call to the cheapest capable model.",
    href: "/docs/concepts/cost-optimization",
  },
  {
    title: "Quality Guard",
    desc: "How Zyra prevents quality loss when downgrading models for simple tasks.",
    href: "/docs/concepts/quality-guard",
  },
  {
    title: "Chat completions API",
    desc: "OpenAI-compatible POST /v1/chat/completions parameters, auth, and streaming notes.",
    href: "/docs/api/chat-completions",
  },
  {
    title: "Architecture",
    desc: "End-to-end proxy flow: your app, Zyra, providers, and observability.",
    href: "/architecture",
  },
];

export default function DocsHomePage() {
  return (
    <>
      <div className="border border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 inline-flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" /> DOCS
      </div>
      <h1 className="text-3xl md:text-5xl font-black tracking-[-0.03em] leading-tight mb-4">Documentation</h1>
      <p className="text-gray-400 text-[15px] leading-relaxed max-w-2xl mb-12">
        Guides and reference for integrating Zyra: SDK setup, core concepts, API routes, and links to the
        broader product story. Use the sidebar or search (⌘K) to jump deeper.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-16">
        {SPOTLIGHT.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group block p-5 bg-brand-surface border border-white/[0.06] rounded-xl hover:border-brand-accent/25 transition-all"
          >
            <h2 className="text-[15px] font-bold text-gray-200 group-hover:text-brand-accent transition-colors mb-1">
              {item.title}
            </h2>
            <p className="text-gray-500 text-[13px] leading-relaxed">{item.desc}</p>
            <span className="inline-block mt-3 text-[12px] text-gray-600 group-hover:text-brand-accent">
              Read more →
            </span>
          </Link>
        ))}
      </div>

      <section className="mb-12 space-y-6 text-[14px] text-gray-400 leading-relaxed">
        <h2 className="text-lg font-bold text-gray-100 border-b border-white/[0.06] pb-2">Still expanding</h2>
        <p>
          Additional guides (installation deep-dives, dashboard topics, full SDK and REST coverage) will
          land as dedicated MDX pages—the structure above is the entry point. For product questions, email{" "}
          <a href="mailto:support@zyra.dev" className="text-brand-accent hover:underline">
            support@zyra.dev
          </a>
          .
        </p>
      </section>

      <div className="p-8 bg-brand-surface border border-white/[0.06] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-[15px] mb-1 text-white">Ready to try Zyra?</h3>
          <p className="text-gray-400 text-[13px]">Create an account and generate an API key in the dashboard.</p>
        </div>
        <Link
          href="/register"
          className="bg-brand-accent text-black px-6 py-3 rounded-lg text-[13px] font-bold hover:bg-white transition-all shrink-0"
        >
          Get started →
        </Link>
      </div>
    </>
  );
}
