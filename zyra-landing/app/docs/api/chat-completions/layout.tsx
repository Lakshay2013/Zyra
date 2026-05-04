import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat completions API",
  description: "OpenAI-compatible chat completions endpoint for Zyra with authentication and parameters.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
