'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = 'April 21, 2026'

type ContentBlock = { subtitle?: string; text: string }
type Section = { title: string; content: ContentBlock[] }

const sections: Section[] = [
  {
    title: '1. Information We Collect',
    content: [
      {
        subtitle: 'Account Information',
        text: 'When you create an account, we collect your name, email address, organization name, and authentication credentials. If you sign in via Google OAuth, we receive your name, email, and Google account identifier.',
      },
      {
        subtitle: 'Usage Data',
        text: 'We automatically collect information about how you interact with the Zyra platform, including API request metadata (model used, token counts, latency, cost), dashboard activity, and feature usage patterns. We do NOT store the content of your prompts or AI model responses.',
      },
      {
        subtitle: 'Technical Data',
        text: 'We collect IP addresses, browser type, device information, and operating system details for security monitoring and service optimization.',
      },
      {
        subtitle: 'Payment Information',
        text: 'Payment details are processed securely through third-party payment processors. We do not store or have access to your full credit card numbers.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      {
        text: 'We use the information we collect to:',
      },
      {
        text: '• Provide, maintain, and improve the Zyra proxy service and dashboard\n• Route API requests intelligently across providers to optimize cost and performance\n• Generate analytics and cost savings reports for your organization\n• Process transactions and send related notifications\n• Detect, prevent, and address security threats, fraud, and technical issues\n• Communicate with you about updates, security alerts, and support\n• Comply with legal obligations',
      },
    ],
  },
  {
    title: '3. Data Sharing & Third Parties',
    content: [
      {
        subtitle: 'AI Providers',
        text: 'When you submit API requests through Zyra, we forward them to your configured AI providers (e.g., OpenAI, Anthropic, Google, Groq). Your provider API keys are encrypted at rest using AES-256 encryption and are only decrypted at the moment of request forwarding.',
      },
      {
        subtitle: 'Service Providers',
        text: 'We use select third-party services for infrastructure (hosting, databases, email delivery). These providers are contractually bound to protect your data and only process it on our behalf.',
      },
      {
        subtitle: 'Legal Requirements',
        text: 'We may disclose information if required by law, regulation, legal process, or governmental request.',
      },
      {
        subtitle: 'No Data Sales',
        text: 'We do not sell, rent, or trade your personal information or API traffic data to third parties. Ever.',
      },
    ],
  },
  {
    title: '4. Data Security',
    content: [
      {
        text: 'We implement industry-standard security measures to protect your data:',
      },
      {
        text: '• All data in transit is encrypted via TLS 1.3\n• Provider API keys are encrypted at rest with AES-256\n• Passwords are hashed using bcrypt with salt rounds\n• Rate limiting and brute-force protection on all endpoints\n• JWT-based authentication with configurable expiration\n• Regular security audits and dependency vulnerability scanning\n• Role-based access control (RBAC) for team features',
      },
    ],
  },
  {
    title: '5. Cookies & Tracking',
    content: [
      {
        text: 'Zyra uses minimal cookies strictly necessary for authentication and session management. We do not use advertising cookies or third-party tracking pixels. We use local storage to persist your authentication token and UI preferences.',
      },
    ],
  },
  {
    title: '6. Data Retention',
    content: [
      {
        text: 'We retain your account data for as long as your account is active. API interaction logs (metadata only — not prompt content) are retained for up to 90 days for analytics purposes. You can request deletion of your data at any time by contacting us. Upon account deletion, we remove your personal data within 30 days, except where retention is required by law.',
      },
    ],
  },
  {
    title: '7. Your Rights',
    content: [
      {
        text: 'Depending on your jurisdiction, you may have the following rights:',
      },
      {
        text: '• Access: Request a copy of the personal data we hold about you\n• Rectification: Request correction of inaccurate data\n• Deletion: Request deletion of your data ("right to be forgotten")\n• Portability: Request your data in a structured, machine-readable format\n• Object: Object to data processing for specific purposes\n• Restrict: Request restriction of processing in certain circumstances',
      },
      {
        text: 'To exercise any of these rights, contact us at privacy@zyra.dev. We will respond within 30 days.',
      },
    ],
  },
  {
    title: '8. International Data Transfers',
    content: [
      {
        text: 'Your data may be processed in jurisdictions outside your country of residence. We ensure that appropriate safeguards are in place for international data transfers, including standard contractual clauses where applicable.',
      },
    ],
  },
  {
    title: '9. Children\'s Privacy',
    content: [
      {
        text: 'Zyra is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.',
      },
    ],
  },
  {
    title: '10. Changes to This Policy',
    content: [
      {
        text: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last Updated" date. Your continued use of Zyra after changes constitutes acceptance of the updated policy.',
      },
    ],
  },
  {
    title: '11. Contact Us',
    content: [
      {
        text: 'If you have any questions about this Privacy Policy or our data practices, please contact us at:\n\nEmail: privacy@zyra.dev\nAddress: Zyra Inc., Bangalore, India',
      },
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-brand-bg text-white min-h-screen font-sans">
      {/* Nav */}
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-brand-bg/80 border-b border-white/[0.05]">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-black text-xl tracking-tight text-brand-accent hover:opacity-80 transition-opacity">
            ZYRA
          </Link>
          <Link href="/" className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="mb-16">
          <div className="border border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
            LEGAL
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.03em] leading-tight mb-6">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-[15px] leading-relaxed max-w-2xl">
            At Zyra, we take your privacy seriously. This policy explains how we collect,
            use, and protect your data when you use our AI cost optimization platform.
          </p>
          <div className="mt-6 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em]">
            Last Updated: {LAST_UPDATED}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {sections.map((section, i) => (
            <section key={i} className="group">
              <h2 className="text-xl font-bold tracking-tight mb-6 text-gray-100 group-hover:text-brand-accent transition-colors">
                {section.title}
              </h2>
              <div className="space-y-5 pl-1">
                {section.content.map((block, j) => (
                  <div key={j}>
                    {block.subtitle && (
                      <h3 className="text-[14px] font-semibold text-gray-300 mb-2">
                        {block.subtitle}
                      </h3>
                    )}
                    <p className="text-gray-400 text-[14px] leading-[1.8] whitespace-pre-line">
                      {block.text}
                    </p>
                  </div>
                ))}
              </div>
              {i < sections.length - 1 && (
                <div className="mt-12 h-[1px] bg-white/[0.04]" />
              )}
            </section>
          ))}
        </div>

        {/* Bottom CTAs */}
        <div className="mt-20 p-8 bg-brand-surface border border-white/[0.06] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-[15px] mb-1">Have questions about your data?</h3>
            <p className="text-gray-400 text-[13px]">
              Reach out to our privacy team at{' '}
              <a href="mailto:privacy@zyra.dev" className="text-brand-accent hover:underline">
                privacy@zyra.dev
              </a>
            </p>
          </div>
          <Link
            href="/terms"
            className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg text-[13px] font-medium hover:bg-white/10 transition-all shrink-0"
          >
            View Terms of Service →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 font-mono">
          <div>© 2026 ZYRA INC. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6 mt-3 sm:mt-0">
            <Link href="/privacy" className="text-brand-accent">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
