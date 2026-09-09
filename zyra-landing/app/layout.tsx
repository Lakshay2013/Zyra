import type { Metadata } from 'next'
import './globals.css'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Zyra AI Proxy (Beta) — Cut AI Costs with Smart Routing',
  description: 'Zyra intelligently routes your AI requests across providers to cut costs, improve reliability, and give you full control — without changing your code. Currently in Beta.',
  keywords: ['AI cost optimization', 'LLM proxy', 'reduce OpenAI costs', 'AI routing infrastructure', 'AI cost reduction'],
  openGraph: {
    title: 'Zyra AI Proxy (Beta) — Cut AI Costs with Smart Routing',
    description: 'Zyra intelligently routes your AI requests across providers to cut costs, improve reliability, and give you full control — without changing your code. Currently in Beta.',
    type: 'website',
  },
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

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
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {children}
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#1c1b1c', color: '#e5e2e3', border: '1px solid rgba(83,67,65,0.2)', fontSize: '13px', fontFamily: '\'JetBrains Mono\', monospace' } }} />
          </GoogleOAuthProvider>
        ) : (
          <>
            {children}
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#1c1b1c', color: '#e5e2e3', border: '1px solid rgba(83,67,65,0.2)', fontSize: '13px', fontFamily: '\'JetBrains Mono\', monospace' } }} />
          </>
        )}
      </body>
    </html>
  )
}