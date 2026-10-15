import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick start",
  description: "Install Zyra SDK, configure your API key, and send your first optimized chat completion.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
