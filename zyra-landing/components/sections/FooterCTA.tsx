import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'

const COLUMNS = [
  { title: 'Product', links: [{ label: 'Providers', href: '#providers' }, { label: 'Capabilities', href: '#capabilities' }, { label: 'Architecture', href: '/architecture' }] },
  { title: 'Developers', links: [{ label: 'Docs', href: '/docs' }, { label: 'GitHub', href: 'https://github.com/Lakshay2013/Zyra' }] },
  { title: 'Resources', links: [{ label: 'Observability', href: '/observability' }, { label: 'Status', href: '/status' }, { label: 'Security', href: '/security' }] },
  { title: 'Project', links: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lakshay-mishra-429b43296/' }, { label: 'Email', href: 'mailto:mishralakshay42@gmail.com' }] },
]

export function FinalCTA() {
  return (
    <section className="border-t border-border bg-bg-subtle px-6 py-24 text-center">
      <h2 className="type-display mx-auto max-w-2xl text-text">Stop paying frontier prices for "hi".</h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/register"><Button size="lg">Get API Key</Button></Link>
        <Link href="/docs"><Button size="lg" variant="outline">Read Docs</Button></Link>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-5">
        <div>
          <Logo className="text-text" />
          <p className="mt-3 max-w-[220px] text-[13px] text-text-tertiary">
            An OpenAI-compatible gateway that routes every request to the cheapest model that can handle it.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="type-mono text-[11px] text-text-tertiary">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[13px] text-text-secondary transition-colors hover:text-text" target={l.href.startsWith('http') ? '_blank' : undefined} rel={l.href.startsWith('http') ? 'noreferrer' : undefined}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-border pt-6 text-[12px] text-text-tertiary">
        MIT licensed · v0.1.0-beta
      </div>
    </footer>
  )
}
