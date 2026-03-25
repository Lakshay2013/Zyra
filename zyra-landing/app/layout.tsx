import type { Metadata } from 'next'
import './globals.css'

import { GoogleOAuthProvider } from '@react-oauth/google'

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
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy'}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}