import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quality Guard",
  description: "How Zyra prevents quality degradation when routing to cheaper LLM models.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
