import type { Metadata } from 'next'
import './globals.css'

import { GoogleOAuthProvider } from '@react-oauth/google'

export const metadata: Metadata = {
  title: 'Zyra — AI Cost Optimization Layer',
  description: 'Zyra sits between your app and AI models and automatically reduces your AI costs without changing your code.',
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