import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cost optimization",
  description: "How Zyra scores task complexity and routes to cost-effective models without sacrificing capability.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
