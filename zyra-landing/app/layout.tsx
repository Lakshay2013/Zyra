import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-jbmono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Zyra — Route every LLM request to the cheapest model that can handle it',
  description: 'An OpenAI-compatible gateway that routes each request to the cheapest capable model across OpenAI, Anthropic, Groq, and Gemini. Change one line: model: "auto".',
  keywords: ['AI cost optimization', 'LLM proxy', 'reduce OpenAI costs', 'AI routing infrastructure', 'AI cost reduction'],
  openGraph: {
    title: 'Zyra — Route every LLM request to the cheapest model that can handle it',
    description: 'An OpenAI-compatible gateway that routes each request to the cheapest capable model across OpenAI, Anthropic, Groq, and Gemini. Change one line: model: "auto".',
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
    <html lang="en" className={jetbrainsMono.variable}>
      <body>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {children}
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#16161A', color: '#FAF9F6', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', fontFamily: 'var(--font-sans)', borderRadius: '10px' } }} />
          </GoogleOAuthProvider>
        ) : (
          <>
            {children}
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#16161A', color: '#FAF9F6', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', fontFamily: 'var(--font-sans)', borderRadius: '10px' } }} />
          </>
        )}
      </body>
    </html>
  )
}