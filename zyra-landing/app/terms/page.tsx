'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = 'April 21, 2026'

type ContentBlock = { subtitle?: string; text: string }
type Section = { title: string; content: ContentBlock[] }

const sections: Section[] = [
  {
    title: '1. Acceptance of Terms',
    content: [
      {
        text: 'By accessing or using the Zyra platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms. If you do not agree with any part of these Terms, you must not use the Service.',
      },
    ],
  },
  {
    title: '2. Description of Service',
    content: [
      {
        text: 'Zyra provides an intelligent AI proxy infrastructure that sits between your application and AI model providers. The Service includes:',
      },
      {
        text: '• Cost-optimized routing of API requests across multiple AI providers\n• Real-time analytics dashboard with cost tracking and savings reports\n• API key management and provider configuration\n• Quality-preserving model downgrading for cost reduction\n• Automatic failover and retry mechanisms\n• Organization and team management features',
      },
      {
        text: 'Zyra acts as a pass-through proxy. We facilitate communication between your application and your configured AI providers but do not generate AI outputs ourselves.',
      },
    ],
  },
  {
    title: '3. Account Registration',
    content: [
      {
        text: 'To use the Service, you must create an account and provide accurate, complete, and current information. You are responsible for:\n\n• Maintaining the confidentiality of your account credentials\n• All activity that occurs under your account\n• Notifying us immediately of any unauthorized access\n• Ensuring that your use complies with applicable laws in your jurisdiction',
      },
    ],
  },
  {
    title: '4. Acceptable Use',
    content: [
      {
        subtitle: 'You agree NOT to:',
        text: '• Use the Service for any unlawful purpose or in violation of any applicable law\n• Attempt to gain unauthorized access to any part of the Service or its systems\n• Reverse engineer, decompile, or attempt to extract the source code of the Service\n• Use the Service to transmit malicious code, viruses, or harmful content\n• Interfere with or disrupt the integrity or performance of the Service\n• Use the Service to generate content that violates the acceptable use policies of underlying AI providers\n• Exceed rate limits or abuse the Service infrastructure\n• Resell or redistribute the Service without written authorization',
      },
    ],
  },
  {
    title: '5. API Keys & Provider Credentials',
    content: [
      {
        text: 'You are responsible for providing your own API keys for third-party AI providers (OpenAI, Anthropic, Google, Groq, etc.). Zyra encrypts these keys at rest but you are ultimately responsible for:\n\n• The security and proper management of your provider API keys\n• Costs incurred through your provider accounts as a result of proxied requests\n• Complying with the terms of service of each AI provider you configure\n\nZyra is not liable for any charges incurred on your provider accounts.',
      },
    ],
  },
  {
    title: '6. Pricing & Billing',
    content: [
      {
        subtitle: 'Plans',
        text: 'Zyra offers multiple service tiers including a free Builder plan and paid Pro and Growth plans. Plan features, request limits, and pricing are as displayed on our pricing page at the time of subscription.',
      },
      {
        subtitle: 'Payment',
        text: 'Paid plans are billed monthly or annually in advance. All fees are non-refundable except as required by applicable law. We reserve the right to change pricing with 30 days written notice.',
      },
      {
        subtitle: 'Overages',
        text: 'If you exceed the request limits of your plan, additional requests may be throttled or charged at overage rates as specified in your plan details.',
      },
    ],
  },
  {
    title: '7. Data & Privacy',
    content: [
      {
        text: 'Your use of the Service is subject to our Privacy Policy, which is incorporated by reference into these Terms. Key points:\n\n• We do NOT store, log, or retain the content of your prompts or AI model responses\n• We collect API request metadata (model, tokens, cost, latency) for analytics\n• Your provider API keys are encrypted at rest\n• You retain full ownership of your data\n\nFor complete details, refer to our Privacy Policy at zyra.dev/privacy.',
      },
    ],
  },
  {
    title: '8. Intellectual Property',
    content: [
      {
        text: 'The Service, including all software, designs, trademarks, and documentation, is the intellectual property of Zyra Inc. You are granted a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms.\n\nYou retain all rights to your data, API configurations, and any content generated through your use of third-party AI providers via the Service.',
      },
    ],
  },
  {
    title: '9. Service Availability & SLA',
    content: [
      {
        text: 'We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We may temporarily suspend the Service for maintenance, updates, or security reasons.\n\nGrowth plan subscribers may be eligible for a Service Level Agreement (SLA) with uptime guarantees. Details are provided upon subscription to the Growth plan.',
      },
    ],
  },
  {
    title: '10. Limitation of Liability',
    content: [
      {
        text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW:\n\n• Zyra is provided "AS IS" and "AS AVAILABLE" without warranties of any kind\n• We disclaim all implied warranties, including merchantability and fitness for a particular purpose\n• We are not liable for any indirect, incidental, special, consequential, or punitive damages\n• Our total liability shall not exceed the amount you paid to Zyra in the 12 months preceding the claim\n• We are not responsible for downtime or errors in third-party AI provider services\n• We are not liable for any costs incurred on your AI provider accounts',
      },
    ],
  },
  {
    title: '11. Termination',
    content: [
      {
        text: 'Either party may terminate these Terms at any time:\n\n• You may close your account through the dashboard or by contacting support\n• We may suspend or terminate your access if you violate these Terms\n• Upon termination, your right to use the Service ceases immediately\n• We will retain your data for 30 days post-termination, after which it will be deleted\n• Provisions relating to IP, liability, and dispute resolution survive termination',
      },
    ],
  },
  {
    title: '12. Dispute Resolution',
    content: [
      {
        text: 'Any disputes arising from these Terms or the Service shall be governed by the laws of India. Disputes shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in Bangalore, India.',
      },
    ],
  },
  {
    title: '13. Changes to Terms',
    content: [
      {
        text: 'We reserve the right to modify these Terms at any time. We will provide notice of material changes via email or prominent notice within the Service. Your continued use after changes constitutes acceptance of the modified Terms.',
      },
    ],
  },
  {
    title: '14. Contact',
    content: [
      {
        text: 'For questions about these Terms, contact us at:\n\nEmail: legal@zyra.dev\nAddress: Zyra Inc., Bangalore, India',
      },
    ],
  },
]

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-400 text-[15px] leading-relaxed max-w-2xl">
            These terms govern your use of the Zyra AI cost optimization platform.
            Please read them carefully before using our service.
          </p>
          <div className="mt-6 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em]">
            Last Updated: {LAST_UPDATED} &nbsp;•&nbsp; Effective Immediately
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
            <h3 className="font-bold text-[15px] mb-1">Need more information?</h3>
            <p className="text-gray-400 text-[13px]">
              Contact our legal team at{' '}
              <a href="mailto:legal@zyra.dev" className="text-brand-accent hover:underline">
                legal@zyra.dev
              </a>
            </p>
          </div>
          <Link
            href="/privacy"
            className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg text-[13px] font-medium hover:bg-white/10 transition-all shrink-0"
          >
            View Privacy Policy →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 font-mono">
          <div>© 2026 ZYRA INC. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6 mt-3 sm:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-brand-accent">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
