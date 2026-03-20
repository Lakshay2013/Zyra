import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zyra — LLM Observability & Risk Monitoring',
  description: 'Proxy your LLM traffic through Zyra. Get instant visibility into every call — PII leaks, prompt injections, abuse patterns, cost, and latency.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}