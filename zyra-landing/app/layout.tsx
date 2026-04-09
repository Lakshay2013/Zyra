import type { Metadata } from 'next'
import './globals.css'

import { GoogleOAuthProvider } from '@react-oauth/google'

export const metadata: Metadata = {
  title: 'Reduce AI Costs by 90% | Zyra AI Proxy',
  description: 'Zyra intelligently routes your AI requests across providers to cut costs, improve reliability, and give you full control — without changing your code.',
  keywords: ['AI cost optimization', 'LLM proxy', 'reduce OpenAI costs', 'AI routing infrastructure', 'AI cost reduction'],
  openGraph: {
    title: 'Reduce AI Costs by 90% | Zyra AI Proxy',
    description: 'Zyra intelligently routes your AI requests across providers to cut costs, improve reliability, and give you full control — without changing your code.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy'}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}